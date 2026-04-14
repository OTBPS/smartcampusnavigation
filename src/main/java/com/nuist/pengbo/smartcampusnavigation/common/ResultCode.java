package com.nuist.pengbo.smartcampusnavigation.common;

public enum ResultCode {
    SUCCESS(0, "success"),
    BAD_REQUEST(4000, "bad request"),
    VALIDATION_ERROR(4001, "validation error"),
    NOT_FOUND(4004, "resource not found"),
    INTERNAL_ERROR(5000, "internal server error");

    private final int code;
    private final String message;

    ResultCode(int code, String message) {
        this.code = code;
        this.message = message;
    }

    public int getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}
