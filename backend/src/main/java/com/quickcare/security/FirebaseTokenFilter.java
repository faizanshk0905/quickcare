package com.quickcare.security;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.quickcare.model.User;
import com.quickcare.repository.FirestoreDatabaseService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Component
public class FirebaseTokenFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseTokenFilter.class);

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private FirestoreDatabaseService databaseService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            try {
                // 1. Attempt Firebase Admin SDK ID token verification first
                try {
                    FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(token);
                    if (decodedToken != null) {
                        String uid = decodedToken.getUid();
                        String email = decodedToken.getEmail();
                        Optional<User> userOpt = databaseService.findUserByUid(uid);
                        String role = userOpt.map(u -> u.getRole()).orElse("PATIENT");

                        UserPrincipal principal = new UserPrincipal(uid, email, role);
                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        filterChain.doFilter(request, response);
                        return;
                    }
                } catch (Exception fbEx) {
                    // Fall through to JWT validation
                }

                // 2. Validate application JWT
                if (jwtUtil.isTokenValid(token)) {
                    String email = jwtUtil.extractUsername(token);
                    String uid = jwtUtil.extractUid(token);
                    String role = jwtUtil.extractRole(token);

                    UserPrincipal principal = new UserPrincipal(uid, email, role);
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (Exception e) {
                logger.error("Authentication filter error: {}", e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }
}
