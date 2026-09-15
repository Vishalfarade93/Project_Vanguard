import { useState, useEffect, useCallback } from 'react';
import { DepartmentBudget, ExpenseStatus, ExpenseSummary, PredictedExpense } from '../types';
import {
  getExpenses,
  getSummary,
  getDepartmentBudgets,
  updateExpenseStatus,
  triggerExtraction,
} from '../api/expenses';

export function useExpenses() {
  const [expenses, setExpenses] = useState<PredictedExpense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [departmentBudgets, setDepartmentBudgets] = useState<DepartmentBudget[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [expensesData, summaryData, deptsData] = await Promise.all([
        getExpenses(),
        getSummary(),
        getDepartmentBudgets().catch(() => []),
      ]);
      setExpenses(expensesData);
      setSummary(summaryData);
      setDepartmentBudgets(deptsData);
    } catch (err: any) {
      console.error('Failed to load expenses data:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Silent background auto-refresh every 4 seconds for live Slack updates
    const interval = setInterval(() => {
      Promise.all([
        getExpenses(),
        getSummary(),
        getDepartmentBudgets().catch(() => []),
      ])
        .then(([expensesData, summaryData, deptsData]) => {
          setExpenses(expensesData);
          setSummary(summaryData);
          setDepartmentBudgets(deptsData);
        })
        .catch(() => {});
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchData]);

  // Optimistic update for Approve / Reject actions
  const handleUpdateStatus = async (id: number, newStatus: ExpenseStatus) => {
    const previousExpenses = [...expenses];

    // Optimistically update local UI state
    setExpenses((current) =>
      current.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );

    try {
      await updateExpenseStatus(id, newStatus);
      // Refresh summary numbers to stay in exact sync
      const [updatedSummary, updatedDepts] = await Promise.all([
        getSummary(),
        getDepartmentBudgets().catch(() => []),
      ]);
      setSummary(updatedSummary);
      setDepartmentBudgets(updatedDepts);
    } catch (err: any) {
      console.error('Failed to update status on server:', err);
      setExpenses(previousExpenses);
      setError('Failed to update expense status. Reverted change.');
    }
  };

  const handleRunExtraction = async (): Promise<{ count: number; message: string }> => {
    try {
      setIsExtracting(true);
      const res = await triggerExtraction();
      await fetchData();
      return { count: res.extractedCount, message: res.message };
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'AI extraction failed';
      setError(msg);
      throw err;
    } finally {
      setIsExtracting(false);
    }
  };

  return {
    expenses,
    summary,
    departmentBudgets,
    loading,
    error,
    isExtracting,
    refetch: fetchData,
    updateStatus: handleUpdateStatus,
    runExtraction: handleRunExtraction,
  };
}
