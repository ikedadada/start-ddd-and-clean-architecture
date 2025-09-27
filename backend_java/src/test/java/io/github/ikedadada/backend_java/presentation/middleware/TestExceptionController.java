package io.github.ikedadada.backend_java.presentation.middleware;

import org.springframework.http.HttpMethod;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

@RestController
@Validated
class TestExceptionController {

    @GetMapping("/throw-http")
    String throwHttp() throws HttpException {
        throw new HttpException.Conflict("boom");
    }

    @PostMapping("/validate")
    String validate(@RequestBody @Valid ValidationRequest request) {
        return "ok";
    }

    @GetMapping("/no-resource")
    String noResource() throws NoResourceFoundException {
        throw new NoResourceFoundException(HttpMethod.GET, "/no-resource");
    }

    @GetMapping("/runtime")
    String runtime() {
        throw new IllegalStateException("boom");
    }

    static record ValidationRequest(@NotBlank String title) {
    }
}
