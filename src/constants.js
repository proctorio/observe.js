const OBSERVE_TYPES = {
    START_EXAM: "startExam",
    TAKE_EXAM: "takeExam",
    START_DESK_SCAN: "startDeskScan",
    END_DESK_SCAN: "endDeskScan",
    END_EXAM: "endExam",
    EXAM_CLOSE_CODE: "examCloseCode",
    FLAGS_PAYLOAD: "flagsPayload",
    CONNECT_SUCCESS: "proctorioConnectSuccess",
    CONNECTION_INIT: "proctorioConnectionInit",
    PROCTOR_INTERRUPTED: "proctorInterrupted",
    PROCTOR_RESUMED: "proctorResumed",
    PROCTOR_KICKED_OUT: "proctorKickedOut",
    PROCTORIO_STATUS: "proctorio_status",
    BREAK_STARTED: "breakStarted",
    BREAK_ENDED: "breakEnded",
    BREAK_EXCEEDED: "breakExceeded",
    BREAK_GIVEN: "breakGiven",
    ADDITIONAL_CAMERA_CONNECTED: "additionalCameraConnected",
    ADDITIONAL_CAMERA_DISCONNECTED: "additionalCameraDisconnected",
    ADDITIONAL_CAMERA_ROTATED: "additionalCameraRotated",
	ADDITIONAL_CAMERA_ROTATION_CLEARED: "additionalCameraRotationCleared",
	ADDITIONAL_CAMERA_OBSCURED: "additionalCameraObscured",
	ADDITIONAL_CAMERA_OBSCURED_CLEARED: "additionalCameraObscuredCleared"
}

export default OBSERVE_TYPES;