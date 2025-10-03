import { jest } from '@jest/globals';
import Observe from '../src/index.js'

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
            };
            const e2 = {
                data: { type: "flagsPayload", payload: { offset: 2000, flagsData: { unfocus_detected: false } } },
                origin: window.top.origin,
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
            };
            const e2 = {
                data: { type: "takeExam", payload: { offset: 2000 } },
                origin: window.top.origin,
            };

            listenerFunction(e1);
            listenerFunction(e2);

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith({ offset: 1000 });
        });

        test('should process all one-time event types', () => {
            const events = [
                { type: "startDeskScan", method: 'startDeskScan' },
                { type: "endDeskScan", method: 'endDeskScan' },
                { type: "endExam", method: 'endExam' },
                { type: "examCloseCode", method: 'examCloseCode' }
            ];

            events.forEach(({ type, method }) => {
                const callback = jest.fn();
                observeInstance[method](callback);

                const e = {
                    data: { type, payload: { offset: 1000 } },
                    origin: window.top.origin,
                };

                listenerFunction(e);

                expect(callback).toHaveBeenCalledWith({ offset: 1000 });
                expect(callback).toHaveBeenCalledTimes(1);
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
                };
                listenerFunction(e);
            }

            expect(callback).toHaveBeenCalledTimes(5);
        });

        test('should handle proctorioConnectSuccess event type', () => {
            const e = {
                data: { type: "proctorioConnectSuccess" },
                origin: window.top.origin,
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
            };

            // Get the listener for this test
            const badListenerFunction = window.top.addEventListener.mock.calls[window.top.addEventListener.mock.calls.length - 1][1];

            // Should not throw error
            expect(() => badListenerFunction(e)).not.toThrow();
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
            };

            // Should not throw error
            expect(() => listenerFunction(e)).not.toThrow();
        });
    });
});
