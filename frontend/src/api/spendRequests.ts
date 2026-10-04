import { apiClient } from './client';
import { SpendRequest, SpendRequestStatus } from '../types';

/**
  * Fetch all employee spend requests for the current workspace.
  */
 export async function getSpendRequests(status?: SpendRequestStatus): Promise<SpendRequest[]> {
   const url = status ? `/spend-requests?status=${status}` : '/spend-requests';
   const response = await apiClient.get<SpendRequest[]>(url);
   return response.data;
 }

/**
  * Submit a /buy command (e.g. from Slack simulation or direct UI console).
  */
 export async function submitBuyCommand(
   text: string,
   sender?: string,
   channel?: string
 ): Promise<SpendRequest> {
   const response = await apiClient.post<SpendRequest>('/spend-requests/command', {
     text,
     sender,
     channel,
   });
   return response.data;
 }

/**
  * Manager 1-click Approval: generates single-use virtual card with category lock & 24h expiry.
  */
 export async function approveSpendRequest(
   id: number,
   customCap?: number
 ): Promise<SpendRequest> {
   const response = await apiClient.post<SpendRequest>(`/spend-requests/${id}/approve`, {
     customCap,
   });
   return response.data;
 }

/**
  * Manager Rejection with optional reason.
  */
 export async function rejectSpendRequest(
   id: number,
   reason?: string
 ): Promise<SpendRequest> {
   const response = await apiClient.post<SpendRequest>(`/spend-requests/${id}/reject`, {
     reason,
   });
   return response.data;
 }

/**
  * Simulate merchant card transaction swipe.
  */
 export async function simulateCardSwipe(
   id: number,
   amount: number,
   merchantName?: string
 ): Promise<SpendRequest> {
   const response = await apiClient.post<SpendRequest>(`/spend-requests/${id}/simulate-swipe`, {
     amount,
     merchantName,
   });
   return response.data;
 }

/**
  * Reconcile invoice receipt and attach audit verification.
  */
 export async function reconcileReceipt(
   id: number,
   receiptSnippet?: string
 ): Promise<SpendRequest> {
   const response = await apiClient.post<SpendRequest>(`/spend-requests/${id}/reconcile`, {
     receiptSnippet,
   });
   return response.data;
 }
