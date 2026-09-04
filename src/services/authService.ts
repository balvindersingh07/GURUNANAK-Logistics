import apiRequest, { setToken, getToken } from './api';
import type { User, UserRole } from '../types';
import { mapUser } from '../utils/mappers';

interface AuthResponse {
  token: string;
  user: Record<string, unknown>;
}

interface MeResponse {
  user: Record<string, unknown>;
}

export const authService = {
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const data = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    const user = mapUser(data.user);
    localStorage.setItem('gnk_auth', JSON.stringify(user));
    return { token: data.token, user };
  },

  async register(payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
  }) {
    return apiRequest<{ message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getMe(): Promise<User> {
    const data = await apiRequest<MeResponse>('/auth/me');
    const user = mapUser(data.user);
    localStorage.setItem('gnk_auth', JSON.stringify(user));
    return user;
  },

  async forgotPassword(email: string) {
    return apiRequest<{ message: string; resetToken?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token: string, password: string) {
    return apiRequest<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },

  logout() {
    setToken(null);
    localStorage.removeItem('gnk_auth');
  },

  isAuthenticated() {
    return !!getToken();
  },
};
