import { apiClient } from './client';

export interface ConnectedInbox {
  id: number;
  workspaceId: number;
  emailAddress: string;
  inboxLabel: string;
  provider: string;
  isActive: boolean;
  lastSyncedAt?: string;
  messagesScannedCount: number;
  createdAt: string;
}

export interface GoogleAuthUrlResponse {
  authUrl: string;
  workspaceId: number;
  inboxLabel: string;
}

export interface SyncResponse {
  status: string;
  totalInboxesSynced?: number;
  newMessagesIngested?: number;
  newMessagesCount?: number;
  subjects?: string[];
  ingestedSubjects?: string[];
}

export interface VerificationCodeResponse {
  workspaceId: number;
  verificationCode: string;
  hasCode: boolean;
}

export async function getGoogleAuthUrl(inboxLabel = 'Billing & Quotes'): Promise<GoogleAuthUrlResponse> {
  const res = await apiClient.get<GoogleAuthUrlResponse>('/integrations/google/auth-url', {
    params: { inboxLabel },
  });
  return res.data;
}

export async function handleGoogleCallback(code: string, inboxLabel = 'Billing & Quotes'): Promise<ConnectedInbox> {
  const res = await apiClient.post<ConnectedInbox>('/integrations/google/callback', {
    code,
    inboxLabel,
  });
  return res.data;
}

export async function connectSandboxInbox(emailAddress: string, inboxLabel = 'Primary Billing'): Promise<ConnectedInbox> {
  const res = await apiClient.post<ConnectedInbox>('/integrations/google/sandbox-connect', {
    emailAddress,
    inboxLabel,
  });
  return res.data;
}

export async function getConnectedInboxes(): Promise<ConnectedInbox[]> {
  const res = await apiClient.get<ConnectedInbox[]>('/integrations/google/inboxes');
  return res.data;
}

export async function syncMailboxes(inboxId?: number): Promise<SyncResponse> {
  const res = await apiClient.post<SyncResponse>('/integrations/google/sync', null, {
    params: inboxId ? { inboxId } : undefined,
  });
  return res.data;
}

export async function disconnectInbox(inboxId: number): Promise<void> {
  await apiClient.delete(`/integrations/google/inbox/${inboxId}`);
}

export async function getForwardingVerificationCode(): Promise<VerificationCodeResponse> {
  const res = await apiClient.get<VerificationCodeResponse>('/integrations/google/verification-code');
  return res.data;
}
