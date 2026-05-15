package com.trainmark.gateway;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class GatewayAuthFilter implements GlobalFilter, Ordered {
  private static final List<String> PUBLIC_PREFIXES = List.of("/actuator/", "/api/auth/");
  private static final ParameterizedTypeReference<Map<String, Object>> AUTH_RESPONSE_TYPE =
      new ParameterizedTypeReference<>() {};
  private final WebClient authClient;

  public GatewayAuthFilter(@Value("${trainmark.auth-service.url:http://localhost:8081}") String authServiceUrl) {
    this.authClient = WebClient.builder()
        .baseUrl(authServiceUrl)
        .build();
  }

  @Override
  public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
    var request = exchange.getRequest();
    if (request.getMethod() == HttpMethod.OPTIONS || isPublicPath(request.getURI().getPath())) {
      return chain.filter(exchange);
    }

    var authorization = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
    if (authorization == null || !authorization.startsWith("Bearer ")) {
      return unauthorized(exchange, "Authentication is required");
    }

    return authClient.get()
        .uri("/api/auth/me")
        .header(HttpHeaders.AUTHORIZATION, authorization)
        .retrieve()
        .bodyToMono(AUTH_RESPONSE_TYPE)
        .flatMap(payload -> forwardAuthenticatedRequest(exchange, chain, payload))
        .onErrorResume(error -> unauthorized(exchange, "Invalid access token"));
  }

  @Override
  public int getOrder() {
    return -100;
  }

  private boolean isPublicPath(String path) {
    return PUBLIC_PREFIXES.stream().anyMatch(path::startsWith);
  }

  @SuppressWarnings("unchecked")
  private Mono<Void> forwardAuthenticatedRequest(
      ServerWebExchange exchange,
      GatewayFilterChain chain,
      Map<String, Object> payload
  ) {
    if (!Boolean.TRUE.equals(payload.get("success"))) {
      return unauthorized(exchange, "Invalid access token");
    }
    var data = (Map<String, Object>) payload.get("data");
    if (data == null) {
      return unauthorized(exchange, "Invalid access token");
    }

    var userId = String.valueOf(data.getOrDefault("id", ""));
    var username = String.valueOf(data.getOrDefault("username", ""));
    var roles = data.get("roles") instanceof List<?> roleList
        ? String.join(",", roleList.stream().map(String::valueOf).toList())
        : "";
    var authenticatedRequest = exchange.getRequest().mutate()
        .header("X-TrainMark-User-Id", userId)
        .header("X-TrainMark-Username", username)
        .header("X-TrainMark-Roles", roles)
        .build();
    return chain.filter(exchange.mutate().request(authenticatedRequest).build());
  }

  private Mono<Void> unauthorized(ServerWebExchange exchange, String message) {
    var response = exchange.getResponse();
    response.setStatusCode(HttpStatus.UNAUTHORIZED);
    response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
    var body = "{\"success\":false,\"data\":null,\"message\":\"" + message + "\"}";
    DataBuffer buffer = response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8));
    return response.writeWith(Mono.just(buffer));
  }
}
