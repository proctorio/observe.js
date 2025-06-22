import OBSERVE_TYPES from './constants.js'

export default class Observe {
    static #instance = null;

    constructor() {
        if (Observe.#instance) {
            return Observe.#instance;
        }

        Observe.#instance = this;
        this.#initListener();
        this.#initConnection();
    }

    #handlers = {};
    #listenerInitialized = false;
    #processedTypes = new Set();
    #connectingInterval = null;
    #T = OBSERVE_TYPES;



    #triggerOnceTypes = new Set([
        this.#T.START_EXAM,
        this.#T.TAKE_EXAM,
        this.#T.START_DESK_SCAN,
        this.#T.END_DESK_SCAN,
        this.#T.END_EXAM,
        this.#T.EXAM_CLOSE_CODE
    ]);

    #initConnection() {
        this.#connectingInterval = setInterval(() => {
            try {
                window.top.postMessage({ type: this.#T.CONNECTION_INIT }, "*");
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
            this.#triggerOnceTypes.has(type);

        if (isRelevantType && this.#connectingInterval) {
            clearInterval(this.#connectingInterval);
        }
    }

    #isValidType(type) {
        const isFlagType = type === this.#T.FLAGS_PAYLOAD;
        const isTriggerOnceType = this.#triggerOnceTypes.has(type) && !this.#processedTypes.has(type);

        return isFlagType || isTriggerOnceType;
    }

    #initListener() {
        if (this.#listenerInitialized) return;

        window.addEventListener("message", (e) => {
            const { type, payload } = e.data || {};

            this.#clearInitConnectionInterval(type);

            if (this.#isValidType(type)) {
                const callback = this.#handlers[type];

                if (callback && typeof callback === "function") {
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
}