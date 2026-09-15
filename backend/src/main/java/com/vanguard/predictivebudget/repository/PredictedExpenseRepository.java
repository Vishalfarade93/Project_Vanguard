package com.vanguard.predictivebudget.repository;

import com.vanguard.predictivebudget.model.ExpenseStatus;
import com.vanguard.predictivebudget.model.PredictedExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PredictedExpenseRepository extends JpaRepository<PredictedExpense, Long> {
    List<PredictedExpense> findAllByOrderByPredictedDateAsc();
    List<PredictedExpense> findByStatus(ExpenseStatus status);
    List<PredictedExpense> findByWorkspaceId(Long workspaceId);
    List<PredictedExpense> findByWorkspaceIdOrderByPredictedDateAsc(Long workspaceId);
    java.util.Optional<PredictedExpense> findFirstByWorkspaceIdAndThreadTsOrderByCreatedAtDesc(Long workspaceId, String threadTs);
    java.util.Optional<PredictedExpense> findFirstByWorkspaceIdAndTopicKeyOrderByCreatedAtDesc(Long workspaceId, String topicKey);
}
