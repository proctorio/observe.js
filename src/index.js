import OBSERVE_TYPES from './constants.js'

const DEFAULT_TRUSTED_ORIGIN = "https://getproctorio.com";

// A postMessage targetOrigin of "*" means "deliver to any origin" - it must
// never be accepted as a configured origin, or it would restore the wildcard
// broadcast this fix removes. Parses with the URL constructor rather than a
// hand-rolled pattern, since a pattern that only rejects "/" lets through
// things like a query string, fragment, userinfo, or stray characters in the
// host that URL parsing would otherwise normalize away or reject outright.
// Strips a stray trailing slash from manually configured origins, then
// requires the parsed, serialized origin to equal the (trimmed) input
// exactly - anything parsed down to something different (a path, query,
// fragment, userinfo, etc.) is rejected rather than silently stripped.
const normalizeOrigin = (origin) => {
    if (typeof origin !== "string") return null;

    const trimmed = origin.replace(/\/+$/, "");

    let parsed;
    try {
        parsed = new URL(trimmed);
    } catch {
        return null;
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (parsed.origin !== trimmed) return null;

    return parsed.origin;
};

class Observe {
    /** @type {Observe | null} */
    static #instance = null;

    constructor(options) {
        const { trustedOrigins, parentOrigin } = options ?? {};

        if (Observe.#instance) {
            // Options are merged onto the existing singleton rather than discarded,
            // since the constructor's early-return would otherwise silently ignore
            // config passed by any caller after the first.
            Observe.#instance.#applyConfig({ trustedOrigins, parentOrigin });
            return Observe.#instance;
        }

        this.#applyConfig({ trustedOrigins, parentOrigin });

        Observe.#instance = this;
        this.#initListener();
        this.#initConnection();
    }

    #handlers = {};
    #listenerInitialized = false;
    #processedTypes = new Set();
    #connectingInterval = null;
    #trustedOrigins = new Set();
    #parentOrigin;
    #T = OBSERVE_TYPES;

    #triggerOnceTypes = new Set([
        this.#T.START_EXAM,
        this.#T.TAKE_EXAM,
        this.#T.END_EXAM,
        this.#T.EXAM_CLOSE_CODE,
        this.#T.PROCTOR_KICKED_OUT
    ]);

    #multipleTriggerTypes = new Set([
        this.#T.PROCTOR_INTERRUPTED,
        this.#T.PROCTOR_RESUMED,
        this.#T.PROCTORIO_STATUS,
        this.#T.BREAK_STARTED,
        this.#T.BREAK_ENDED,
        this.#T.BREAK_EXCEEDED,
        this.#T.BREAK_GIVEN,
        this.#T.ADDITIONAL_CAMERA_CONNECTED,
        this.#T.ADDITIONAL_CAMERA_DISCONNECTED,
        this.#T.ADDITIONAL_CAMERA_ROTATED,
        this.#T.ADDITIONAL_CAMERA_ROTATION_CLEARED,
        this.#T.ADDITIONAL_CAMERA_OBSCURED,
        this.#T.ADDITIONAL_CAMERA_OBSCURED_CLEARED,
        this.#T.START_DESK_SCAN,
        this.#T.END_DESK_SCAN
    ]);

    #initConnection() {
        this.#connectingInterval = setInterval(() => {
            try {
                window.top.postMessage({ type: this.#T.CONNECTION_INIT }, this.#parentOrigin);
            }
            catch (e) {
                console.error(e);
            }
        }, 500);
    }

    #clearInitConnectionInterval(type) {
        const isRelevantType =
            type === this.#T.CONNECT_SUCCESS ||
            type === this.#T.FLAGS_PAYLOAD ||
            this.#multipleTriggerTypes.has(type) || 
            this.#triggerOnceTypes.has(type);

        if (isRelevantType && this.#connectingInterval) {
            clearInterval(this.#connectingInterval);
        }
    }

    #isValidType(type) {
        const isFlagType = type === this.#T.FLAGS_PAYLOAD;
        const isTriggerOnceType = this.#triggerOnceTypes.has(type) && !this.#processedTypes.has(type);
        const isMultipleTriggerType = this.#multipleTriggerTypes.has(type);
        return isFlagType || isTriggerOnceType || isMultipleTriggerType;
    }

    // Reading a cross-origin window's Location properties throws; same-origin
    // access (including the common window === window.top case) does not. This
    // is the only reliable way to detect "I'm embedded behind a parent whose
    // origin I can't see", since the mismatch itself produces no other signal.
    static #isTopOriginReadable() {
        try {
            void window.top.location.origin;
            return true;
        } catch {
            return false;
        }
    }

    #applyConfig({ trustedOrigins, parentOrigin }) {
        if (parentOrigin !== undefined) {
            const concreteParentOrigin = normalizeOrigin(parentOrigin);

            if (concreteParentOrigin === null) {
                throw new Error(
                    `Observe: parentOrigin must be a concrete "https://host[:port]" origin, ` +
                    `got ${JSON.stringify(parentOrigin)}. A wildcard ("*") or empty value is not allowed.`
                );
            }

            this.#parentOrigin = concreteParentOrigin;
        } else if (this.#parentOrigin === undefined) {
            if (!Observe.#isTopOriginReadable()) {
                throw new Error(
                    `Observe: this page is embedded in a cross-origin iframe, so parentOrigin ` +
                    `can't be auto-detected (the browser blocks reading a cross-origin parent's ` +
                    `location). Pass it explicitly, e.g. new Observe({ parentOrigin: "https://your_lms_domain" }).`
                );
            }

            this.#parentOrigin = window.location.origin;
        }

        const extraOrigins = Array.isArray(trustedOrigins) ? trustedOrigins : [];

        [window.location.origin, DEFAULT_TRUSTED_ORIGIN, this.#parentOrigin, ...extraOrigins]
            .map(normalizeOrigin)
            .filter(Boolean)
            .forEach((origin) => this.#trustedOrigins.add(origin));
    }

    #isTrustedEvent(e) {
        // window: extension content scripts bridge into whichever frame they're injected into.
        // window.top: the proctorio_status handshake and connection init broadcast target window.top,
        // so a genuinely embedded SDK (window !== window.top) legitimately receives replies from there.
        const isTrustedSource = e.source === window || e.source === window.top;
        return this.#trustedOrigins.has(e.origin) && isTrustedSource;
    }

    #initListener() {
        if (this.#listenerInitialized) return;

        window.addEventListener("message", (e) => {
            if (!this.#isTrustedEvent(e)) return;

            const { type, payload } = e.data || {};

            this.#clearInitConnectionInterval(type);

            if (this.#isValidType(type) && Object.hasOwn(this.#handlers, type)) {
                const callback = this.#handlers[type];

                if (typeof callback === "function") {
                    if (this.#triggerOnceTypes.has(type)) this.#processedTypes.add(type);
                    callback(payload);
                }
            }
        });

        this.#listenerInitialized = true;
    }

    #register(type, callback) {
        this.#handlers[type] = callback;
    }

    startDeskScan(callback) {
        this.#register(this.#T.START_DESK_SCAN, callback);
    }

    endDeskScan(callback) {
        this.#register(this.#T.END_DESK_SCAN, callback);
    }

    startExam(callback) {
        this.#register(this.#T.START_EXAM, callback);
    }

    takeExam(callback) {
        this.#register(this.#T.TAKE_EXAM, callback);
    }

    endExam(callback) {
        this.#register(this.#T.END_EXAM, callback);
    }

    examCloseCode(callback) {
        this.#register(this.#T.EXAM_CLOSE_CODE, callback);
    }

    flags(callback) {
        this.#register(this.#T.FLAGS_PAYLOAD, callback);
    }

    proctorInterrupted(callback) {
        this.#register(this.#T.PROCTOR_INTERRUPTED, callback);
    }

    proctorResumed(callback) {
        this.#register(this.#T.PROCTOR_RESUMED, callback);
    }

    proctorKickedOut(callback) {
        this.#register(this.#T.PROCTOR_KICKED_OUT, callback);
    }

    proctorioStatusResponse(callback) {
        this.#register(this.#T.PROCTORIO_STATUS, callback);
    }

    proctorioStatusRequest(origin = DEFAULT_TRUSTED_ORIGIN) {
        const concreteOrigin = normalizeOrigin(origin);

        if (concreteOrigin === null) {
            console.error(
                `Observe: proctorioStatusRequest origin must be a concrete "https://host[:port]" origin, ` +
                `got ${JSON.stringify(origin)}. A wildcard ("*") or empty value is not allowed.`
            );
            return;
        }

        try {
            window.top.postMessage([ this.#T.PROCTORIO_STATUS ], concreteOrigin);
        }
        catch (e) {
            console.error(e);
        }
    }

    breakStarted(callback) {
        this.#register(this.#T.BREAK_STARTED, callback)
    }

    breakEnded(callback) {
        this.#register(this.#T.BREAK_ENDED, callback)
    }

    breakExceeded(callback) {
        this.#register(this.#T.BREAK_EXCEEDED, callback)
    }

    breakGiven(callback) {
        this.#register(this.#T.BREAK_GIVEN, callback)
    }

    additionalCameraConnected(callback) {
        this.#register(this.#T.ADDITIONAL_CAMERA_CONNECTED, callback)
    }

    additionalCameraDisconnected(callback) {
        this.#register(this.#T.ADDITIONAL_CAMERA_DISCONNECTED, callback)
    }

    additionalCameraRotated(callback) {
        this.#register(this.#T.ADDITIONAL_CAMERA_ROTATED, callback)
    }

    additionalCameraRotationCleared(callback) {
        this.#register(this.#T.ADDITIONAL_CAMERA_ROTATION_CLEARED, callback)
    }

    additionalCameraObscured(callback) {
        this.#register(this.#T.ADDITIONAL_CAMERA_OBSCURED, callback)
    }

    additionalCameraObscuredCleared(callback) {
        this.#register(this.#T.ADDITIONAL_CAMERA_OBSCURED_CLEARED, callback)
    }
}

export { OBSERVE_TYPES, Observe };