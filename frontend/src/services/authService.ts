import api from '../lib/axios';
import type { LoginResponse, User } from '../types/user';

export const authService = {
  login: async (email: string, password: string) =>
    (await api.post<LoginResponse>('/login', { email, password })).data,

  logout: async () => {
    await api.post('/logout');
  },

  me: async () => (await api.get<User>('/user')).data,
};