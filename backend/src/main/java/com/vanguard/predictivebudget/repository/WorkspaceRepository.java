package com.vanguard.predictivebudget.repository;

import com.vanguard.predictivebudget.model.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {
    Optional<Workspace> findBySlackTeamId(String slackTeamId);
    Optional<Workspace> findBySlug(String slug);
    Optional<Workspace> findByInboundEmailSlug(String inboundEmailSlug);
}
