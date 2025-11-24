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
    PROCTORIO_STATUS: "proctorio_status"
}

export default OBSERVE_TYPES;