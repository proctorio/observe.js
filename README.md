# Observe.js

A JavaScript SDK for subscribing to Proctorio exam monitoring events. This library enables developers to listen to key events during online exam lifecycles and implement custom logic for exam monitoring and security.

## Features

- **Event-driven architecture** for real-time exam monitoring
- **Singleton pattern** ensures consistent state across your application
- **Cross-origin communication** with Proctorio browser extension
- **Multiple build formats** (ESM, CommonJS, IIFE) for flexible integration

## Installation

```bash
npm install @proctorio/observe
```

## Quick Start

```javascript
import Observe from '@proctorio/observe';

// Create observe instance (singleton)
const observe = new Observe();

// Listen for exam start
observe.startExam((data) => {
  console.log('Exam started at offset:', data.offset);
});

// Listen for security flags
observe.flags((data) => {
  console.log('Security flags detected:', data.flagsData);
  console.log('Time offset:', data.offset);
});

// Listen for live proctor events - available in live proctor exams:

//Listen for exam interrupted
observe.proctorInterrupted((data) => {
  console.log('Exam interrupted at offset:', data.offset);
});

//Listen for exam resumed
observe.proctorResumed((data) => {
  console.log('Exam resumed at offset:', data.offset);
});

//Listen for live proctor kickout 
observe.proctorKickedOut((data) => {
  console.log('Candidate kicked out from exam at offset:', data.offset);
});
```

## Supported Events

### One-time Events
These events trigger only once during the exam lifecycle:

- **`startExam`** - Fired when the exam officially begins
- **`takeExam`** - Fired when the user starts taking the exam
- **`startDeskScan`** - Fired when desk scanning process starts
- **`endDeskScan`** - Fired when desk scanning process completes
- **`endExam`** - Fired when exam ending logic is triggered
- **`examCloseCode`** - Fired when exam closes with a specific close code
- **`proctorKickedOut`** - Fired when a sudent is kicked out by live proctor during an exam

### Recurring Events
- **`flags`** - Fired every 200-500ms when security flags are detected. Contains an object with boolean flags for various security violations.

### Multi-trigger Events
- **`proctorInterrupted`** - Fired when live proctor interrupts the exam, can happen multiple times during an exam.
- **`proctorResumed`** - Fired when live proctor resumes the interrupted exam, can happen multiple times during an exam.


## Event Data Structure

All events include a `data` object with an `offset` property representing milliseconds from exam start time.

### Common Event Data
```javascript
{
  offset: 1000 // milliseconds from exam start
}
```

### examCloseCode Event
```javascript
{
  offset: 5000, // milliseconds from exam start
  closeCode: 42 // specific close code number
}
```

### flags Event
```javascript
{
  offset: 2000, // milliseconds from exam start
  flagsData: {
    unfocus_detected: true,
    clipboard_detected: false,
    browser_resize_detected: false,
    multiple_faces_detected: true,
    leaving_exam_area_detected: false,
    speaking_detected: false,
    ai_detected: false,
    printing_detected: false,
    screenshot_detected: false,
    hardware_change_detected: false,
    external_action_detected: false,
    webcam_obscured_detected: false,
    mobile_phone_detected: false
  }
}
```

## API Reference

### Constructor
```javascript
const observe = new Observe();
```
Returns a singleton instance of the Observe class.

### Event Subscription Methods

#### `observe.startExam(callback)`
Subscribe to exam start events.

#### `observe.takeExam(callback)`
Subscribe to exam taking events.

#### `observe.startDeskScan(callback)`
Subscribe to desk scan start events.

#### `observe.endDeskScan(callback)`
Subscribe to desk scan completion events.

#### `observe.endExam(callback)`
Subscribe to exam end events.

#### `observe.examCloseCode(callback)`
Subscribe to exam close code events.

#### `observe.flags(callback)`
Subscribe to security flag detection events.

#### `observe.proctorInterrupted(callback)`
Subscribe to live proctor exam interrupted events.

#### `observe.proctorResumed(callback)`
Subscribe to live proctor exam resumed events.

#### `observe.proctorKickedOut(callback)`
Subscribe to live proctor exam kickout events.

**Parameters:**
- `callback` (function): Function to execute when the event fires. Receives event data as parameter.

## Browser Support

- Modern browsers with ES6+ support
- Requires `window.top.postMessage` and `window.addEventListener` APIs
- Compatible with Proctorio browser extension

## Important Notes

⚠️ **Page Transition Limitations**: Events triggered during page transitions (like `endExam` and `examCloseCode`) may not execute reliably due to browser unload behavior.

⚠️ **Initialization Context**: Avoid initializing Observe on exam completion pages as it will have no effect.

⚠️ **Connection Behavior**: The SDK automatically attempts to establish communication with the Proctorio extension using periodic message passing until successful connection.

## Development

### Building
```bash
npm run build  # Creates ESM, CommonJS, and minified IIFE builds in lib/
```

### Testing
```bash
npm test  # Run Jest tests with jsdom environment
```

### Build Outputs
- `lib/index.esm.js` - ES module format
- `lib/index.cjs.js` - CommonJS format
- `lib/index.min.js` - Minified IIFE for browser use

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure all tests pass
5. Submit a pull request

## License

Apache License 2.0 - see [LICENCE](LICENCE) file for details.

## Support

For issues and questions, please [open an issue](https://github.com/proctorio/observe.js/issues) on GitHub.