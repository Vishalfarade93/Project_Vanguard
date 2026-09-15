package com.vanguard.predictivebudget.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class AuthDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RegisterRequest {
        private String companyName;
        private String fullName;
        private String email;
        private String password;
        private String slackToken;

        @com.fasterxml.jackson.annotation.JsonProperty("adminFullName")
        public void setAdminFullName(String adminFullName) {
            if (this.fullName == null || this.fullName.isEmpty()) {
                this.fullName = adminFullName;
            }
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuthResponse {
        private String token;
        private UserDto user;
        private WorkspaceDto workspace;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserDto {
        private Long id;
        private String email;
        private String fullName;
        private String role;
        private Long workspaceId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WorkspaceDto {
        private Long id;
        private String name;
        private String slug;
        private String slackTeamId;
    }
}
