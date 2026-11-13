import { beforeEach, jest } from '@jest/globals';
import { Observe } from '../src/index.js'

beforeEach(() => {
    jest.spyOn(window.top, "addEventListener").mockImplementation(jest.fn());

    global.window.top = {
        origin: 'http://test.com',
        postMessage: jest.fn(),
    };
});

describe('Observe Class Tests', () => {
    test('should add event listener on initialization', () => {
        const observeInstance = new Observe();

        expect(window.top.addEventListener).toHaveBeenCalledTimes(1);
        expect(window.top.addEventListener).toHaveBeenCalledWith("message", expect.any(Function));
    });

    test('should not initialize the listener again if already initialized', () => {
        const observeInstance = new Observe();
        const observeInstanceCopy = new Observe();

        expect(window.top.addEventListener).toHaveBeenCalledTimes(1);
    });

    describe('Event Handling Tests', () => {
        let observeInstance;
        let listenerFunction;

        beforeEach(() => {
            observeInstance = new Observe();
            // Get the listener function for this instance
            listenerFunction = window.top.addEventListener.mock.calls[window.top.addEventListener.mock.calls.length - 1][1];
        });

        test('should not process message if type is invalid', () => {
            const callback = jest.fn();
            observeInstance.startExam(callback);

            const e = {
                data: { type: "invalidType" },
                origin: window.top.origin,
                source: window,
            };

            window.top.postMessage(e.data, e.origin);

            // we need manually to trigger this in Jest
            listenerFunction(e);

            expect(callback).toHaveBeenCalledTimes(0);
        });

        test('should process the correct message event', () => {
            const callback = jest.fn();
            observeInstance.startExam(callback);


            const e = {
                data: { type: "startExam" },
                origin: window.top.origin,
                source: window,
            };

            window.top.postMessage(e.data, e.origin);

            // we need manually to trigger this in Jest
            listenerFunction(e);

            expect(callback).toHaveBeenCalledTimes(1);
        });

        test('should process flags event (recurring)', () => {
            const callback = jest.fn();
            observeInstance.flags(callback);

            const e1 = {
                data: { type: "flagsPayload", payload: { offset: 1000, flagsData: { unfocus_detected: true } } },
                origin: window.top.origin,
                source: window,
            };
            const e2 = {
                data: { type: "flagsPayload", payload: { offset: 2000, flagsData: { unfocus_detected: false } } },
                origin: window.top.origin,
                source: window,
            };

            listenerFunction(e1);
            listenerFunction(e2);

            expect(callback).toHaveBeenCalledTimes(2);
            expect(callback).toHaveBeenNthCalledWith(1, { offset: 1000, flagsData: { unfocus_detected: true } });
            expect(callback).toHaveBeenNthCalledWith(2, { offset: 2000, flagsData: { unfocus_detected: false } });
        });

        test('should not process one-time events multiple times', () => {
            const callback = jest.fn();
            observeInstance.takeExam(callback);

            const e1 = {
                data: { type: "takeExam", payload: { offset: 1000 } },
                origin: window.top.origin,
                source: window,
            };
            const e2 = {
                data: { type: "takeExam", payload: { offset: 2000 } },
                origin: window.top.origin,
                source: window,
            };

            listenerFunction(e1);
            listenerFunction(e2);

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith({ offset: 1000 });
        });

        test('should process all one-time event types', () => {
            const events = [
                { type: "endExam", method: 'endExam' },
                { type: "examCloseCode", method: 'examCloseCode' },
                { type: "proctorKickedOut", method: 'proctorKickedOut' }
            ];

            events.forEach(({ type, method }) => {
                const callback = jest.fn();
                observeInstance[method](callback);

                const e = {
                    data: { type, payload: { offset: 1000 } },
                    origin: window.top.origin,
                    source: window,
                };

                listenerFunction(e);

                expect(callback).toHaveBeenCalledWith({ offset: 1000 });
                expect(callback).toHaveBeenCalledTimes(1);
            });
        });

        test('should process all multiple trigger event types multiple times', () => {
            const events = [
                { type: "proctorInterrupted", method: 'proctorInterrupted' },
                { type: "proctorResumed", method: 'proctorResumed' },
                { type: "proctorio_status", method: 'proctorioStatusResponse' },
                { type: "breakStarted", method: 'breakStarted'},
                { type: "breakEnded", method: 'breakEnded'},
                { type: "breakExceeded", method: 'breakExceeded'},
                { type: "breakGiven", method: 'breakGiven'},
                { type: "additionalCameraConnected", method: 'additionalCameraConnected'},
                { type: "additionalCameraDisconnected", method: 'additionalCameraDisconnected'},
                { type: "additionalCameraRotated", method: 'additionalCameraRotated'},
                { type: "additionalCameraRotationCleared", method: 'additionalCameraRotationCleared'},
                { type: "additionalCameraObscured", method: 'additionalCameraObscured'},
                { type: "additionalCameraObscuredCleared", method: 'additionalCameraObscuredCleared'},
                { type: "startDeskScan", method: 'startDeskScan' },
                { type: "endDeskScan", method: 'endDeskScan' }
            ];

            events.forEach(({ type, method }) => {
                const callback = jest.fn();
                observeInstance[method](callback);

                const e1 = {
                    data: { type, payload: { offset: 1000 } },
                    origin: window.top.origin,
                    source: window,
                };

                const e2 = {
                    data: { type, payload: { offset: 2000 } },
                    origin: window.top.origin,
                    source: window,
                };

                listenerFunction(e1);
                listenerFunction(e2);

                expect(callback).toHaveBeenCalledWith({ offset: 1000 });
                expect(callback).toHaveBeenCalledWith({ offset: 2000 });

                expect(callback).toHaveBeenCalledTimes(2);
            });
        });

        test('should handle messages without data', () => {
            const callback = jest.fn();
            observeInstance.startExam(callback);

            const e = {};

            expect(() => listenerFunction(e)).not.toThrow();
            expect(callback).not.toHaveBeenCalled();
        });

        test('should handle messages with null data', () => {
            const callback = jest.fn();
            observeInstance.startExam(callback);

            const e = { data: null };

            expect(() => listenerFunction(e)).not.toThrow();
            expect(callback).not.toHaveBeenCalled();
        });

        test('should handle rapid successive flag events', () => {
            const callback = jest.fn();
            observeInstance.flags(callback);

            // Simulate rapid flag events
            for (let i = 0; i < 5; i++) {
                const e = {
                    data: {
                        type: "flagsPayload",
                        payload: { offset: i * 100, flagsData: { unfocus_detected: i % 2 === 0 } }
                    },
                    origin: window.top.origin,
                    source: window,
                };
                listenerFunction(e);
            }

            expect(callback).toHaveBeenCalledTimes(5);
        });

        test('should handle proctorioConnectSuccess event type', () => {
            const e = {
                data: { type: "proctorioConnectSuccess" },
                origin: window.top.origin,
                source: window,
            };

            // Should not throw error even without callback registered
            expect(() => listenerFunction(e)).not.toThrow();
        });

        test('should not call callback if callback is not a function', () => {
            // Register a non-function as callback
            const badObserveInstance = new Observe();
            badObserveInstance.flags("not a function");

            const e = {
                data: { type: "flagsPayload", payload: { offset: 1000, flagsData: {} } },
                origin: window.top.origin,
                source: window,
            };

            // Get the listener for this test
            const badListenerFunction = window.top.addEventListener.mock.calls[window.top.addEventListener.mock.calls.length - 1][1];

            // Should not throw error
            expect(() => badListenerFunction(e)).not.toThrow();
        });

        test('should handle proctorio status response', () => {
            const callback = jest.fn();
            observeInstance.proctorioStatusResponse(callback);

            const e = {
                data: { 
                    type: "proctorio_status", 
                    payload: { 
                        active: true
                    } 
                },
                origin: window.top.origin,
                source: window,
            };

            listenerFunction(e);

            expect(callback).toHaveBeenCalledWith({ 
               active: true
            });
        });

        test('should handle complex flags data structure', () => {
            const callback = jest.fn();
            observeInstance.flags(callback);

            const e = {
                data: { 
                    type: "flagsPayload", 
                    payload: { 
                        offset: 5000, 
                        flagsData: {
                            unfocus_detected: true,
                            clipboard_detected: false,
                            multiple_faces_detected: true,
                            ai_detected: false
                        }
                    } 
                },
                origin: window.top.origin,
                source: window,
            };

            listenerFunction(e);

            expect(callback).toHaveBeenCalledWith({ 
                offset: 5000, 
                flagsData: {
                    unfocus_detected: true,
                    clipboard_detected: false,
                    multiple_faces_detected: true,
                    ai_detected: false
                }
            });
        });

        test('should clear connection interval on flags event', () => {
            const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
            
            const e = {
                data: { type: "flagsPayload", payload: { offset: 1000, flagsData: {} } },
                origin: window.top.origin,
                source: window,
            };

            observeInstance.flags(jest.fn());
            listenerFunction(e);

            expect(clearIntervalSpy).toHaveBeenCalled();
            clearIntervalSpy.mockRestore();
        });

        test('should not process events without callbacks registered', () => {
            // Create event for a type without callback (using a valid type that hasn't had a callback set)
            const e = {
                data: { type: "proctorioConnectionInit", payload: {} },
                origin: window.top.origin,
                source: window,
            };

            // Should not throw error
            expect(() => listenerFunction(e)).not.toThrow();
        });        
    });

    describe("Origin and source validation", () => {
        let observeInstance;
        let listenerFunction;

        beforeEach(() => {
            observeInstance = new Observe();
            listenerFunction = window.top.addEventListener.mock.calls[window.top.addEventListener.mock.calls.length - 1][1];
        });

        test('should not invoke callback for a message from an untrusted origin', () => {
            const callback = jest.fn();
            observeInstance.proctorKickedOut(callback);

            const e = {
                data: { type: "proctorKickedOut", payload: { offset: 5000, injected: true } },
                origin: "https://evil-attacker.com",
                source: window,
            };

            listenerFunction(e);

            expect(callback).not.toHaveBeenCalled();
        });

        test('should not invoke callback for a message whose source is not the current window', () => {
            const callback = jest.fn();
            observeInstance.flags(callback);

            const e = {
                data: { type: "flagsPayload", payload: { offset: 2000, flagsData: { ai_detected: true } } },
                origin: window.top.origin,
                source: {},
            };

            listenerFunction(e);

            expect(callback).not.toHaveBeenCalled();
        });

        test('should still invoke callback for a message from the trusted origin and source', () => {
            const callback = jest.fn();
            observeInstance.flags(callback);

            const e = {
                data: { type: "flagsPayload", payload: { offset: 5000, flagsData: {} } },
                origin: window.top.origin,
                source: window,
            };

            listenerFunction(e);

            expect(callback).toHaveBeenCalledWith({ offset: 5000, flagsData: {} });
        });

        test('should ignore messages with a missing origin/source entirely', () => {
            const callback = jest.fn();
            observeInstance.endExam(callback);

            const e = {
                data: { type: "endExam", payload: { offset: 1000 } },
            };

            expect(() => listenerFunction(e)).not.toThrow();
            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe("Connection init broadcast", () => {
        // The Observe singleton (and its connection interval) is shared across this
        // whole suite, so a fresh module instance is used here to observe the very
        // first broadcast in isolation.
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
            jest.resetModules();
        });

        test('should not broadcast connection init with a wildcard target origin', async () => {
            jest.resetModules();
            const { Observe: FreshObserve } = await import('../src/index.js');
            const postMessageSpy = jest.spyOn(window.top, 'postMessage').mockImplementation(jest.fn());

            new FreshObserve();

            jest.advanceTimersByTime(500);

            expect(postMessageSpy).toHaveBeenCalledWith(
                { type: "proctorioConnectionInit" },
                window.location.origin
            );
            expect(postMessageSpy).not.toHaveBeenCalledWith(
                expect.anything(),
                "*"
            );

            postMessageSpy.mockRestore();
        });
    });

    describe("Embedded (iframe) configuration", () => {
        afterEach(() => {
            jest.resetModules();
        });

        test('should broadcast connection init to the configured parentOrigin, not self origin', async () => {
            jest.resetModules();
            const { Observe: FreshObserve } = await import('../src/index.js');

            jest.useFakeTimers();
            const postMessageSpy = jest.spyOn(window.top, 'postMessage').mockImplementation(jest.fn());

            new FreshObserve({ parentOrigin: "https://lms.example.com" });

            jest.advanceTimersByTime(500);

            expect(postMessageSpy).toHaveBeenCalledWith(
                { type: "proctorioConnectionInit" },
                "https://lms.example.com"
            );

            postMessageSpy.mockRestore();
            jest.useRealTimers();
        });

        test('should trust messages from the configured parentOrigin without listing it twice', async () => {
            jest.resetModules();
            const { Observe: FreshObserve } = await import('../src/index.js');

            const observeInstance = new FreshObserve({ parentOrigin: "https://lms.example.com" });
            const listenerFunction = window.top.addEventListener.mock.calls[window.top.addEventListener.mock.calls.length - 1][1];

            const callback = jest.fn();
            observeInstance.flags(callback);

            const e = {
                data: { type: "flagsPayload", payload: { offset: 1000, flagsData: {} } },
                origin: "https://lms.example.com",
                source: window.top,
            };

            listenerFunction(e);

            expect(callback).toHaveBeenCalledWith({ offset: 1000, flagsData: {} });
        });
    });

    describe("Config robustness", () => {
        afterEach(() => {
            jest.resetModules();
        });

        test('should not throw when constructed with null', async () => {
            jest.resetModules();
            const { Observe: FreshObserve } = await import('../src/index.js');

            expect(() => new FreshObserve(null)).not.toThrow();
        });

        test('should ignore a non-array trustedOrigins instead of crashing or spreading characters', async () => {
            jest.resetModules();
            const { Observe: FreshObserve } = await import('../src/index.js');

            expect(() => new FreshObserve({ trustedOrigins: "https://extra.example.com" })).not.toThrow();

            const observeInstance = new FreshObserve();
            const listenerFunction = window.top.addEventListener.mock.calls[window.top.addEventListener.mock.calls.length - 1][1];

            const callback = jest.fn();
            observeInstance.flags(callback);

            // If the string were spread char-by-char, "h" would have been added as a trusted origin
            const e = {
                data: { type: "flagsPayload", payload: { offset: 1 } },
                origin: "h",
                source: window,
            };
            listenerFunction(e);

            expect(callback).not.toHaveBeenCalled();
        });

        test('should never trust the opaque "null" origin', async () => {
            jest.resetModules();
            const { Observe: FreshObserve } = await import('../src/index.js');
            const observeInstance = new FreshObserve();
            const listenerFunction = window.top.addEventListener.mock.calls[window.top.addEventListener.mock.calls.length - 1][1];

            const callback = jest.fn();
            observeInstance.flags(callback);

            const e = {
                data: { type: "flagsPayload", payload: { offset: 1 } },
                origin: "null",
                source: window,
            };
            listenerFunction(e);

            expect(callback).not.toHaveBeenCalled();
        });

        test('should normalize a trailing slash on a configured trusted origin', async () => {
            jest.resetModules();
            const { Observe: FreshObserve } = await import('../src/index.js');
            const observeInstance = new FreshObserve({ trustedOrigins: ["https://partner.example.com/"] });
            const listenerFunction = window.top.addEventListener.mock.calls[window.top.addEventListener.mock.calls.length - 1][1];

            const callback = jest.fn();
            observeInstance.flags(callback);

            const e = {
                data: { type: "flagsPayload", payload: { offset: 1 } },
                origin: "https://partner.example.com",
                source: window,
            };
            listenerFunction(e);

            expect(callback).toHaveBeenCalledWith({ offset: 1 });
        });

        test('should merge config from a later new Observe(...) call instead of discarding it', async () => {
            jest.resetModules();
            const { Observe: FreshObserve } = await import('../src/index.js');

            new FreshObserve();
            const observeInstance = new FreshObserve({ trustedOrigins: ["https://later.example.com"] });
            const listenerFunction = window.top.addEventListener.mock.calls[window.top.addEventListener.mock.calls.length - 1][1];

            const callback = jest.fn();
            observeInstance.flags(callback);

            const e = {
                data: { type: "flagsPayload", payload: { offset: 1 } },
                origin: "https://later.example.com",
                source: window,
            };
            listenerFunction(e);

            expect(callback).toHaveBeenCalledWith({ offset: 1 });
        });

        test('should reject an empty string parentOrigin instead of silently substituting self origin', async () => {
            jest.resetModules();
            const { Observe: FreshObserve } = await import('../src/index.js');

            expect(() => new FreshObserve({ parentOrigin: "" })).toThrow();
        });

        test('should reject a wildcard "*" parentOrigin instead of restoring the wildcard broadcast', async () => {
            jest.resetModules();
            const { Observe: FreshObserve } = await import('../src/index.js');

            expect(() => new FreshObserve({ parentOrigin: "*" })).toThrow();
        });

        test('should reject a malformed (non-origin) parentOrigin', async () => {
            jest.resetModules();
            const { Observe: FreshObserve } = await import('../src/index.js');

            // A throw happens before the singleton is set, so each of these is
            // still a "first" construction attempt on this fresh module.
            expect(() => new FreshObserve({ parentOrigin: "not-a-url" })).toThrow();
            expect(() => new FreshObserve({ parentOrigin: "https://lms.example.com/some/path" })).toThrow();
            // A query string, userinfo, or fragment parses "successfully" but
            // down to something other than the input - URL parsing alone
            // would silently accept these unless checked against the input.
            expect(() => new FreshObserve({ parentOrigin: "https://host?x=1" })).toThrow();
            expect(() => new FreshObserve({ parentOrigin: "https://host#frag" })).toThrow();
            expect(() => new FreshObserve({ parentOrigin: "https://user:pass@host" })).toThrow();
            // Invalid host syntax - the URL constructor itself rejects these.
            expect(() => new FreshObserve({ parentOrigin: "https://host :abc" })).toThrow();
            expect(() => new FreshObserve({ parentOrigin: "https://bad  host" })).toThrow();
        });

        test('should never broadcast to a wildcard or empty target origin', async () => {
            jest.resetModules();
            const { Observe: FreshObserve } = await import('../src/index.js');

            jest.useFakeTimers();
            const postMessageSpy = jest.spyOn(window.top, 'postMessage').mockImplementation(jest.fn());

            new FreshObserve({ parentOrigin: "https://lms.example.com" });
            jest.advanceTimersByTime(500);

            expect(postMessageSpy).toHaveBeenCalledWith({ type: "proctorioConnectionInit" }, "https://lms.example.com");
            expect(postMessageSpy).not.toHaveBeenCalledWith(expect.anything(), "*");
            expect(postMessageSpy).not.toHaveBeenCalledWith(expect.anything(), "");

            postMessageSpy.mockRestore();
            jest.useRealTimers();
        });
    });

    describe("Proctorio status request tests", () =>
    {
        let observeInstance;
        beforeEach(() => {
            observeInstance = new Observe();
            jest.spyOn(window.top, 'postMessage').mockImplementation(jest.fn());
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        test('should send proctorio status request to getproctorio', () => {                
            observeInstance.proctorioStatusRequest();

            expect(window.top.postMessage).toHaveBeenCalledWith([ "proctorio_status" ], "https://getproctorio.com");                
        });

        test('should send proctorio status request to custom domain', () => {
            observeInstance.proctorioStatusRequest("http://test.com");

            expect(window.top.postMessage).toHaveBeenCalledWith([ "proctorio_status" ], "http://test.com");
        });

        test('should not broadcast a wildcard proctorio status request', () => {
            observeInstance.proctorioStatusRequest("*");

            expect(window.top.postMessage).not.toHaveBeenCalled();
        });

        test('should not broadcast an empty-string proctorio status request', () => {
            observeInstance.proctorioStatusRequest("");

            expect(window.top.postMessage).not.toHaveBeenCalled();
        });

        test('should not broadcast a malformed (non-origin) proctorio status request', () => {
            observeInstance.proctorioStatusRequest("not-a-url");

            expect(window.top.postMessage).not.toHaveBeenCalled();
        });
    });
});
