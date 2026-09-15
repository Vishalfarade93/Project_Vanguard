package com.vanguard.predictivebudget.service;

import com.vanguard.predictivebudget.dto.AuthDtos.*;
import com.vanguard.predictivebudget.model.User;
import com.vanguard.predictivebudget.model.Workspace;
import com.vanguard.predictivebudget.repository.UserRepository;
import com.vanguard.predictivebudget.repository.WorkspaceRepository;
import com.vanguard.predictivebudget.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final SlackClientService slackClientService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email address is required");
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters long");
        }
        if (request.getCompanyName() == null || request.getCompanyName().trim().isEmpty()) {
            throw new IllegalArgumentException("Company name is required");
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        // 1. Provision new Workspace (Tenant)
        String companyName = request.getCompanyName().trim();
        String slug = companyName.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        if (slug.isEmpty()) slug = "workspace-" + System.currentTimeMillis();

        String workspaceSlug = slug + "-" + (System.currentTimeMillis() % 10000);
        Workspace.WorkspaceBuilder wsBuilder = Workspace.builder()
                .name(companyName)
                .slug(workspaceSlug)
                .inboundEmailSlug(workspaceSlug)
                .createdAt(LocalDateTime.now());

        // Connect Slack immediately if token provided at registration
        if (request.getSlackToken() != null && !request.getSlackToken().trim().isEmpty()) {
            String cleanToken = request.getSlackToken().trim();
            wsBuilder.slackToken(cleanToken);
            try {
                java.util.Map<String, Object> auth = slackClientService.testSlackAuth(cleanToken);
                if (Boolean.TRUE.equals(auth.get("ok"))) {
                    if (auth.containsKey("teamId")) wsBuilder.slackTeamId((String) auth.get("teamId"));
                    if (auth.containsKey("user")) wsBuilder.slackBotName((String) auth.get("user"));
                }
            } catch (Exception ex) {
                log.warn("Slack token test during registration encountered notice: {}", ex.getMessage());
            }
        }

        Workspace workspace = workspaceRepository.save(wsBuilder.build());
        log.info("Created new tenant Workspace ID: {} for company: {} (Slack connected: {})",
                workspace.getId(), companyName, workspace.getSlackToken() != null);

        // 2. Create Organization Admin User
        User user = User.builder()
                .workspaceId(workspace.getId())
                .email(normalizedEmail)
                .fullName(request.getFullName() != null && !request.getFullName().trim().isEmpty()
                        ? request.getFullName().trim() : "Admin User")
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role("ORG_ADMIN")
                .createdAt(LocalDateTime.now())
                .build();
        user = userRepository.save(user);
        log.info("Registered ORG_ADMIN user ID: {} ({}) for workspace: {}", user.getId(), user.getEmail(), workspace.getId());

        // 3. Generate JWT Token
        String token = jwtService.generateToken(
                user.getId(),
                user.getEmail(),
                user.getRole(),
                workspace.getId(),
                workspace.getName(),
                user.getFullName()
        );

        return buildAuthResponse(token, user, workspace);
    }

    public AuthResponse login(LoginRequest request) {
        if (request.getEmail() == null || request.getPassword() == null) {
            throw new IllegalArgumentException("Email and password are required");
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        Workspace workspace = workspaceRepository.findById(user.getWorkspaceId())
                .orElseGet(() -> Workspace.builder().id(user.getWorkspaceId()).name("Default Workspace").build());

        String token = jwtService.generateToken(
                user.getId(),
                user.getEmail(),
                user.getRole(),
                workspace.getId(),
                workspace.getName(),
                user.getFullName()
        );

        return buildAuthResponse(token, user, workspace);
    }

    public AuthResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Workspace workspace = workspaceRepository.findById(user.getWorkspaceId())
                .orElseGet(() -> Workspace.builder().id(user.getWorkspaceId()).name("Default Workspace").build());

        String token = jwtService.generateToken(
                user.getId(),
                user.getEmail(),
                user.getRole(),
                workspace.getId(),
                workspace.getName(),
                user.getFullName()
        );

        return buildAuthResponse(token, user, workspace);
    }

    private AuthResponse buildAuthResponse(String token, User user, Workspace workspace) {
        UserDto userDto = UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .workspaceId(user.getWorkspaceId())
                .build();

        WorkspaceDto workspaceDto = WorkspaceDto.builder()
                .id(workspace.getId())
                .name(workspace.getName())
                .slug(workspace.getSlug())
                .slackTeamId(workspace.getSlackTeamId())
                .build();

        return AuthResponse.builder()
                .token(token)
                .user(userDto)
                .workspace(workspaceDto)
                .build();
    }
}
