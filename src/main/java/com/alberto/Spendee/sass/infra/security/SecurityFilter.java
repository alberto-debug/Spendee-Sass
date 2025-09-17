package com.alberto.Spendee.sass.infra.security;

import com.alberto.Spendee.sass.domain.user.User;
import com.alberto.Spendee.sass.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.List;

@Component
@Order(1)
public class SecurityFilter extends OncePerRequestFilter {
    @Autowired
    TokenService tokenService;
    @Autowired
    UserRepository userRepository;

    private static final Logger logger = LoggerFactory.getLogger(SecurityFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        var token = this.recoverToken(request);
        if (token != null) {
            logger.debug("[SecurityFilter] Token recovered from request for URI {}", request.getRequestURI());
        }
        var login = tokenService.validateToken(token);

        if(login != null){
            try {
                User user = userRepository.findByEmail(login).orElseThrow(() -> new RuntimeException("User Not Found"));
                List<SimpleGrantedAuthority> authorities = user.getRoles().stream()
                        .map(role -> new SimpleGrantedAuthority(role.getName()))
                        .toList();
                var authentication = new UsernamePasswordAuthenticationToken(user, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(authentication);
                logger.debug("[SecurityFilter] Authenticated user {} for URI {}", user.getEmail(), request.getRequestURI());
            } catch (Exception e) {
                logger.warn("[SecurityFilter] Failed to authenticate token for URI {}: {}", request.getRequestURI(), e.getMessage());
            }
        } else if (token != null) {
            logger.debug("[SecurityFilter] Invalid or expired token presented for URI {}", request.getRequestURI());
        }
        filterChain.doFilter(request, response);
    }

    private String recoverToken(HttpServletRequest request){
        // Try to get from Authorization header first
        var authHeader = request.getHeader("Authorization");
        if(authHeader != null) {
            return authHeader.replace("Bearer ", "");
        }

        // Try to get from cookie (for server-side rendering)
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("jwt_token".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }

        return null;
    }
}
