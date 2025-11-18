package com.alberto.Spendee.sass.dto;

public class ResponseDTO<T> {
    private String message;
    private T data;
    private boolean success;
    private String token;

    // Constructor for simple message and token (backward compatibility)
    public ResponseDTO(String message, String token) {
        this.message = message;
        this.token = token;
        this.success = true;
        this.data = null;
    }

    // Constructor for message, data, and success status
    public ResponseDTO(String message, T data, boolean success) {
        this.message = message;
        this.data = data;
        this.success = success;
        this.token = null;
    }

    // Constructor for all fields
    public ResponseDTO(String message, T data, boolean success, String token) {
        this.message = message;
        this.data = data;
        this.success = success;
        this.token = token;
    }

    // Getters and setters
    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
