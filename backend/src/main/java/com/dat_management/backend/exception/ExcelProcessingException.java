// ExcelProcessingException.java
package com.dat_management.backend.exception;

public class ExcelProcessingException extends RuntimeException {
    
    public ExcelProcessingException(String message) {
        super(message);
    }
    
    public ExcelProcessingException(String message, Throwable cause) {
        super(message, cause);
    }
}