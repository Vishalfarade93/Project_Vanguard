import { apiClient } from './client';
import { AuthResponse, LoginPayload, RegisterPayload } from '../types';

export const registerCompany = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const res = await apiClient.post<AuthResponse>('/auth/register', payload);
  return res.data;
};

export const loginUser = async (payload: LoginPayload): Promise<AuthResponse> => {
  const res = await apiClient.post<AuthResponse>('/auth/login', payload);
  return res.data;
};

export const fetchCurrentUser = async (): Promise<AuthResponse> => {
  const res = await apiClient.get<AuthResponse>('/auth/me');
  return res.data;
};
