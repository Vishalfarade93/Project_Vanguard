package com.vanguard.predictivebudget.repository;

import com.vanguard.predictivebudget.model.RawMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RawMessageRepository extends JpaRepository<RawMessage, Long> {
    List<RawMessage> findByIsProcessedFalse();
    List<RawMessage> findByWorkspaceId(Long workspaceId);
    boolean existsByContent(String content);
}
