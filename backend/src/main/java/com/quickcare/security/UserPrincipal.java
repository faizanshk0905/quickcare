package com.quickcare.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

public class UserPrincipal implements UserDetails {

    private final String uid;
    private final String email;
    private final String role;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserPrincipal(String uid, String email, String role) {
        this.uid = uid;
        this.email = email;
        this.role = role != null ? role.toUpperCase() : "PATIENT";
        this.authorities = Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_" + this.role)
        );
    }

    public String getUid() {
        return uid;
    }

    public String getRole() {
        return role;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return "";
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
