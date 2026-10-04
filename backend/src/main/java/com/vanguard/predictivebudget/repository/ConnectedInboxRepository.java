package com.vanguard.predictivebudget.repository;

import com.vanguard.predictivebudget.model.ConnectedInbox;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConnectedInboxRepository extends JpaRepository<ConnectedInbox, Long> {
    List<ConnectedInbox> findByWorkspaceId(Long workspaceId);
    List<ConnectedInbox> findByWorkspaceIdAndIsActiveTrue(Long workspaceId);
    Optional<ConnectedInbox> findByWorkspaceIdAndEmailAddress(Long workspaceId, String emailAddress);
    List<ConnectedInbox> findByIsActiveTrue();
}
