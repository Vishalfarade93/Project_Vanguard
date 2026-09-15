import { apiClient } from './client';
import {
  DepartmentBudget,
  EmailPreset,
  ExpenseStatus,
  ExpenseSummary,
  PredictedExpense,
  RawMessage,
  SlackChannel,
  TenantIntegrationStatus,
} from '../types';

/**
 * Fetch all predicted expenses from Spring Boot backend.
 * Supports optional timeframe filtering: 7d, 30d, 90d, future, history, all.
 */
export async function getExpenses(timeframe?: string): Promise<PredictedExpense[]> {
  const url = timeframe ? `/expenses?timeframe=${encodeURIComponent(timeframe)}` : '/expenses';
  const response = await apiClient.get<PredictedExpense[]>(url);
  return response.data;
}

/**
 * Fetch summary metrics for top cards with optional timeframe filtering.
 */
export async function getSummary(timeframe?: string): Promise<ExpenseSummary> {
  const url = timeframe ? `/expenses/summary?timeframe=${encodeURIComponent(timeframe)}` : '/expenses/summary';
  const response = await apiClient.get<ExpenseSummary>(url);
  return response.data;
}

/**
 * Fetch department budget allocations and consumption.
 */
export async function getDepartmentBudgets(): Promise<DepartmentBudget[]> {
  const response = await apiClient.get<DepartmentBudget[]>('/expenses/department-budgets');
  return response.data;
}

/**
 * Update the approval status of a predicted expense.
 */
export async function updateExpenseStatus(
  id: number,
  status: ExpenseStatus
): Promise<PredictedExpense> {
  const response = await apiClient.patch<PredictedExpense>(`/expenses/${id}/status`, {
    status,
  });
  return response.data;
}

/**
 * Manually trigger AI extraction on unprocessed chat messages.
 */
export async function triggerExtraction(): Promise<{ extractedCount: number; message: string }> {
  const response = await apiClient.post<{ extractedCount: number; message: string }>('/expenses/extract');
  return response.data;
}

/**
 * Simulate an incoming Slack chat message for real-time demonstration.
 */
export async function simulateSlackMessage(text: string, sender: string = 'Alex (Team Member)') {
  const response = await apiClient.post('/slack/simulate', { text, sender });
  return response.data;
}

/**
 * Fetch tenant workspace integration status (Slack, monitored channels, inbound email).
 */
export async function getIntegrationStatus(): Promise<TenantIntegrationStatus> {
  const response = await apiClient.get<TenantIntegrationStatus>('/integrations/slack/status');
  return response.data;
}

/**
 * Persist selected monitored channels for the active tenant workspace.
 */
export async function saveMonitoredChannels(channels: string[]): Promise<{ status: string; channels: string[] }> {
  const response = await apiClient.post('/integrations/slack/save-channels', { channels });
  return response.data;
}

/**
 * List Slack channels using Bot Token.
 */
export async function getSlackChannels(token: string = ''): Promise<SlackChannel[]> {
  const response = await apiClient.get<SlackChannel[]>('/integrations/slack/channels', {
    params: { token },
  });
  return response.data;
}

/**
 * Connect and validate Slack workspace Bot Token via auth.test.
 */
export async function connectSlackWorkspace(token: string): Promise<{
  ok: boolean;
  team?: string;
  teamId?: string;
  user?: string;
  userId?: string;
  url?: string;
  isDemo?: boolean;
  error?: string;
}> {
  const response = await apiClient.post('/integrations/slack/connect', { token });
  return response.data;
}

/**
 * Disconnect Slack integration for the active workspace.
 */
export async function disconnectSlackWorkspace(): Promise<{ status: string }> {
  const response = await apiClient.post('/integrations/slack/disconnect');
  return response.data;
}

/**
 * Fetch Slack OAuth 2.0 authorization URL for 1-click connect.
 */
export async function getSlackAuthorizeUrl(workspaceId?: number): Promise<{
  ok: boolean;
  isConfigured: boolean;
  authorizeUrl?: string;
  message?: string;
}> {
  const response = await apiClient.get('/slack/oauth/authorize-url', {
    params: workspaceId ? { workspaceId } : {},
  });
  return response.data;
}

/**
 * Sync multiple Slack channels and automatically trigger AI expense extraction.
 */
export async function syncSlackChannels(
  token: string = '',
  channels: { id: string; name: string }[] = [],
  limit: number = 20
): Promise<{
  status: string;
  syncedChannelsCount: number;
  messagesIngested: number;
  expensesExtracted: number;
  snippets: string[];
}> {
  const response = await apiClient.post('/integrations/slack/sync', {
    token,
    channels,
    limit,
  });
  return response.data;
}

/**
 * Scrape conversation history from a specific Slack channel.
 */
export async function scrapeSlackChannel(
  token: string,
  channelId: string,
  channelName: string,
  limit: number = 25
): Promise<{ status: string; ingestedCount: number; channel: string; snippets: string[] }> {
  const response = await apiClient.post('/integrations/slack/scrape', {
    token,
    channelId,
    channelName,
    limit,
  });
  return response.data;
}

/**
 * Ingest vendor quotes or capacity expansion emails (Gmail integration).
 */
export async function ingestEmail(
  from: string,
  subject: string,
  body: string
): Promise<{ status: string; rawMessageId: number; subject: string }> {
  const response = await apiClient.post('/integrations/email', { from, subject, body });
  return response.data;
}

/**
 * Fetch realistic email presets.
 */
export async function getEmailPresets(): Promise<EmailPreset[]> {
  const response = await apiClient.get<EmailPreset[]>('/integrations/email/presets');
  return response.data;
}

/**
 * Fetch raw message backlog.
 */
export async function getRawMessages(): Promise<RawMessage[]> {
  const response = await apiClient.get<RawMessage[]>('/expenses/messages');
  return response.data;
}
