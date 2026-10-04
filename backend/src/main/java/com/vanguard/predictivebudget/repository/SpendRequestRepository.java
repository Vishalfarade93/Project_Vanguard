package com.vanguard.predictivebudget.repository;

import com.vanguard.predictivebudget.model.SpendRequest;
import com.vanguard.predictivebudget.model.SpendRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpendRequestRepository extends JpaRepository<SpendRequest, Long> {

    List<SpendRequest> findAllByOrderByCreatedAtDesc();

    List<SpendRequest> findByWorkspaceIdOrderByCreatedAtDesc(Long workspaceId);

    List<SpendRequest> findByWorkspaceIdAndStatusOrderByCreatedAtDesc(Long workspaceId, SpendRequestStatus status);

    long countByWorkspaceIdAndStatus(Long workspaceId, SpendRequestStatus status);
}
