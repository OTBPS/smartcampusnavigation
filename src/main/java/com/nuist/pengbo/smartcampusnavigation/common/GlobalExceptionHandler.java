package com.nuist.pengbo.smartcampusnavigation.common;

import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    @ExceptionHandler(DataAccessException.class)
    public ApiResponse<Object> handleDataAccessException(DataAccessException ex) {
        log.error("Database access exception", ex);
        return ApiResponse.failure(ResultCode.INTERNAL_ERROR,
                "Database connection or query failed. Please check datasource.url/username/password configuration");
    }

    @ExceptionHandler(Exception.class)
    public ApiResponse<Object> handleException(Exception ex) {
        log.error("Unhandled system exception", ex);
        return ApiResponse.failure(ResultCode.INTERNAL_ERROR, "System error, please try again later");
    }
}