package com.alberto.Spendee.sass.infra.security;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class CacheControlFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        String requestURI = httpRequest.getRequestURI();
        
        // Apply cache control headers to protected pages
        if (requestURI.startsWith("/dashboard") || requestURI.startsWith("/admin")) {
            httpResponse.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, private");
            httpResponse.setHeader("Pragma", "no-cache");
            httpResponse.setHeader("Expires", "0");
            httpResponse.setHeader("X-Frame-Options", "DENY");
            httpResponse.setHeader("X-Content-Type-Options", "nosniff");
        }
        
        chain.doFilter(request, response);
    }
}
