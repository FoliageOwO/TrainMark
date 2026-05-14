package com.trainmark.analytics;

import com.trainmark.shared.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class AnalyticsExceptionHandler {
  @ExceptionHandler({
      MissingServletRequestParameterException.class,
      MethodArgumentTypeMismatchException.class,
      IllegalArgumentException.class,
  })
  public ResponseEntity<ApiResponse<Void>> handleBadRequest(Exception exception) {
    return ResponseEntity
        .status(HttpStatus.BAD_REQUEST)
        .body(ApiResponse.fail(exception.getMessage()));
  }

  @ExceptionHandler(IllegalStateException.class)
  public ResponseEntity<ApiResponse<Void>> handleStoreFailure(IllegalStateException exception) {
    return ResponseEntity
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(ApiResponse.fail(exception.getMessage()));
  }
}
