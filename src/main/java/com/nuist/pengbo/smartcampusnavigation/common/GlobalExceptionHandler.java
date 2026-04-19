package com.nuist.pengbo.smartcampusnavigation.common;

import jakarta.validation.ConstraintViolationException;
import org.mybatis.spring.MyBatisSystemException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.dao.DataAccessException;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BusinessException.class)
    public ApiResponse<Object> handleBusinessException(BusinessException ex) {
        return new ApiResponse<>(ex.getCode(), ex.getMessage(), null, java.time.LocalDateTime.now());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ApiResponse<Object> handleMethodArgumentNotValidException(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldError() != null
                ? ex.getBindingResult().getFieldError().getDefaultMessage()
                : ResultCode.VALIDATION_ERROR.getMessage();
        return ApiResponse.failure(ResultCode.VALIDATION_ERROR, message);
    }

    @ExceptionHandler(BindException.class)
    public ApiResponse<Object> handleBindException(BindException ex) {
        String message = ex.getBindingResult().getFieldError() != null
                ? ex.getBindingResult().getFieldError().getDefaultMessage()
                : ResultCode.VALIDATION_ERROR.getMessage();
        return ApiResponse.failure(ResultCode.VALIDATION_ERROR, message);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ApiResponse<Object> handleConstraintViolationException(ConstraintViolationException ex) {
        return ApiResponse.failure(ResultCode.VALIDATION_ERROR, ex.getMessage());
    }

    @ExceptionHandler({DataAccessException.class, MyBatisSystemException.class})
    public ApiResponse<Object> handleDataAccessException(Exception ex) {
        Throwable root = NestedExceptionUtils.getMostSpecificCause(ex);
        String rootType = root != null ? root.getClass().getSimpleName() : ex.getClass().getSimpleName();
        String rootMessage = root != null && root.getMessage() != null
                ? root.getMessage()
                : (ex.getMessage() == null ? "" : ex.getMessage());
        String normalizedRootMessage = rootMessage.toLowerCase();
        String failureCategory;

        log.error("Database access exception. rootType={} rootMessage={}", rootType, rootMessage, ex);

        String clientMessage;
        if (normalizedRootMessage.contains("communications link failure")
                || normalizedRootMessage.contains("connection refused")
                || normalizedRootMessage.contains("cannotgetjdbcconnection")
                || normalizedRootMessage.contains("failed to obtain jdbc connection")
                || normalizedRootMessage.contains("connection timed out")) {
            failureCategory = "CONNECTION";
            clientMessage = "We can't load campus place data right now. Please try again in a moment.";
        } else if (normalizedRootMessage.contains("access denied")
                || normalizedRootMessage.contains("authentication")
                || normalizedRootMessage.contains("login failed")) {
            failureCategory = "AUTH";
            clientMessage = "Data service is temporarily unavailable. Please try again later.";
        } else if (normalizedRootMessage.contains("sqlsyntax")
                || normalizedRootMessage.contains("bad sql grammar")
                || normalizedRootMessage.contains("unknown column")
                || normalizedRootMessage.contains("doesn't exist")
                || normalizedRootMessage.contains("table")) {
            failureCategory = "QUERY";
            clientMessage = "Place data is temporarily unavailable. Please try again later.";
        } else {
            failureCategory = "UNKNOWN";
            clientMessage = "We can't load campus place data right now. Please try again later.";
        }

        log.warn("Database failure category={} rootType={}", failureCategory, rootType);
        return ApiResponse.failure(ResultCode.INTERNAL_ERROR, clientMessage);
    }

    @ExceptionHandler(Exception.class)
    public ApiResponse<Object> handleException(Exception ex) {
        log.error("Unhandled system exception", ex);
        return ApiResponse.failure(ResultCode.INTERNAL_ERROR, "System error, please try again later");
    }
}
