package io.github.ikedadada.backend_java.presentation.middleware;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

public sealed class HttpException extends Exception
        permits HttpException.BadRequest, HttpException.NotFound, HttpException.Conflict,
        HttpException.InternalServerError {
    private final HttpStatusCode statusCode;

    public HttpException(HttpStatusCode statusCode, String message) {
        super(message);
        this.statusCode = statusCode;
    }

    public HttpStatusCode getStatusCode() {
        return statusCode;
    }

    public static final class BadRequest extends HttpException {
        public BadRequest(String message) {
            super(HttpStatus.BAD_REQUEST, message);
        }
    }

    public static final class NotFound extends HttpException {
        public NotFound(String message) {
            super(HttpStatus.NOT_FOUND, message);
        }
    }

    public static final class Conflict extends HttpException {
        public Conflict(String message) {
            super(HttpStatus.CONFLICT, message);
        }
    }

    public static final class InternalServerError extends HttpException {
        public InternalServerError(String message) {
            super(HttpStatus.INTERNAL_SERVER_ERROR, message);
        }
    }
}
