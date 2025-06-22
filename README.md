#  Observe

This package allows you to subscribe to key events triggered by Proctorio during the lifecycle of an online exam. It is intended to help developers listen to events and handle custom logic.

##  Supported Events

Subscribe to the following exam-related events:

* `startExam` – Triggered when the exam is started.
* `takeExam` – Triggered when the user begins taking the exam.
* `startDeskScan` – Triggered when the desk scan process starts.
* `endDeskScan` – Triggered when the desk scan process ends.
* `endExam` – Triggered when the end exam logic is triggered.
* `examCloseCode` – Triggered when the exam is closed with a specific code.
* `flags` – Flags are checked at intervals of either 500ms or 200ms. If at least one flag is positive, a callback will be triggered with an object containing the positive flags. Be mindful that some flags are sent frequently when their values are positive.


##  Installation

```bash
npm install @proctorio/observe
```

##  Usage

```js
import Observe from '@proctorio/observe';

const observeInstance = new Observe();

observeInstance.startExam(callback)

// in case you expect some data:
observeInstance.examCloseCode((data)=>{
	console.log(data.closeCode);
})
```


## Event Data

Each event triggers a callback function. All events include a data payload with an offset value. However, the `examCloseCode` event includes both offset and closeCode values, while the `flags` event includes offset and a flags object.
- offset represents the offset in milliseconds from the exam start time.


### `examCloseCode`
```ts
{
  closeCode: number,
  offset: number
}
```

### `startExam`
```ts
data: {
  offset: number
}
```

### `takeExam`
```ts
data: {
  offset: number
}
```
### `startDeskScan`

```ts
data: {
  offset: number
}
```
### `endDeskScan`
```ts
data: {
  offset: number
}
```

### `endExam`
```ts
data: {
  offset: number
}
```
### `flags`
```ts
data: {
  offset: number
  flagsData: {
    unfocus_detected?: boolean,
    clipboard_detected?: boolean, 
    browser_resize_detected?: boolean, 
    multiple_faces_detected?: boolean, 
    leaving_exam_area_detected?: boolean, 
    speaking_detected?: boolean, 
    ai_detected?: boolean, 
    printing_detected?: boolean, 
    screenshot_detected?: boolean, 
    hardware_change_detected?: boolean, 
    external_action_detected?: boolean, 
    webcam_obscured_detected?: boolean, 
    mobile_phone_detected?: boolean 
    }
}
```

## ```Important```: 

1. Some events triggered during page transitions (e.g., endExam and examCloseCode callbacks) may not execute in Observe due to the context in which they are called - during the page's unload phase in case of reload page.
2. Avoid initializing Observe on exam_end page, as it will have no effect. Additionally, Observe will repeatedly attempt to initialize a channel to the extension via an setInterval and postMessage.