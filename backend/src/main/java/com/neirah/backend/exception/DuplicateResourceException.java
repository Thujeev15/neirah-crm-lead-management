package com.neirah.backend.exception;

/** Thrown when an operation would create a duplicate record (mapped to HTTP 409). */
public class DuplicateResourceException extends RuntimeException {
    public DuplicateResourceException(String message) {
        super(message);
    }
}
