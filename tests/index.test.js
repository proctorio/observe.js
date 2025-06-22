import { jest } from '@jest/globals';
import Observe from '../src/index.js'

beforeEach(() => {
    jest.spyOn(window.top, "addEventListener").mockImplementation(jest.fn());

    global.window.top = {
        origin: 'http://test.com',
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

        beforeEach(() => {
            observeInstance = new Observe();
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
            const listenerFunction = window.top.addEventListener.mock.calls[0][1];
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
            const listenerFunction = window.top.addEventListener.mock.calls[0][1];
            listenerFunction(e);

            expect(callback).toHaveBeenCalledTimes(1);
        });
    });
});
