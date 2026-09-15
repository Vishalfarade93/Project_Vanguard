export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type SourceType = 'SLACK' | 'GMAIL' | 'MANUAL' | 'WEBHOOK';
export type TimeframeOption = '7d' | '30d' | '90d' | 'future' | 'history' | 'all';

export interface PredictedExpense {
  id: number;
  workspaceId: number;
  rawMessageId?: number;
  itemDescription: string;
  estimatedAmount: number;
  costRangeMin?: number;
  costRangeMax?: number;
  confidenceScore: number;
  predictedDate: string;
  status: ExpenseStatus;
  sourceType?: SourceType | string;
  sourceChannelOrSubject?: string;
  rawSnippet?: string;
  aiReasoning?: string;
  department?: string;
  threadTs?: string;
  topicKey?: string;
  isBenchmarkEstimate?: boolean;
  conversationContext?: string;
  revisionCount?: number;
  advanceDaysNotice?: number;
  createdAt: string;
}

export interface ExpenseSummary {
  totalPredictedSpend: number;
  totalExpensesCount: number;
  highConfidenceCount: number;
  highConfidenceSpend: number;
  pendingReviewCount: number;
  pendingReviewSpend: number;
  approvedCount: number;
  approvedSpend: number;
}

export interface DepartmentBudget {
  department: string;
  budgetLimit: number;
  predictedSpend: number;
  percentUsed: number;
  isWarning: boolean;
}

export interface RawMessage {
  id: number;
  workspaceId: number;
  content: string;
  sender: string;
  timestamp: string;
  sourceType?: string;
  sourceChannelOrSubject?: string;
  isProcessed: boolean;
}

export interface SlackChannel {
  id: string;
  name: string;
  topic?: string;
  numMembers?: string;
}

export interface EmailPreset {
  from: string;
  subject: string;
  body: string;
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: 'ORG_ADMIN' | 'FINANCE_ANALYST' | string;
  workspaceId: number;
}

export interface Workspace {
  id: number;
  name: string;
  slug: string;
  slackTeamId?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  workspace: Workspace;
}

export interface RegisterPayload {
  companyName: string;
  fullName: string;
  email: string;
  password?: string;
  slackToken?: string;
}

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface TenantIntegrationStatus {
  workspaceId: number;
  workspaceName: string;
  workspaceSlug: string;
  slackConnected: boolean;
  slackTeamId?: string;
  slackBotName?: string;
  monitoredChannels: string[];
  inboundEmailSlug?: string;
  webhookUrl: string;
}


