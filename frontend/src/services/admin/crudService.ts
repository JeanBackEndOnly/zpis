import api from '../../lib/axios';
import type { ApiResponse, PaginatedResponse } from '../../types/api';

export interface ListParams {
  page?: number;
  per_page?: number;
  search?: string;
  department_id?: number | string;
  [filter: string]: string | number | undefined; // extra filters such as user_role or status
}

export function createCrudService<T, P>(resource: string) {
  const url = `/admin/${resource}`;

  return {
    list: async (params: ListParams = {}) =>
      (await api.get<ApiResponse<PaginatedResponse<T>>>(url, { params })).data,

    get: async (id: number) => (await api.get<ApiResponse<T>>(`${url}/${id}`)).data,

    create: async (payload: P) => (await api.post<ApiResponse<T>>(url, payload)).data,

    update: async (id: number, payload: P) =>
      (await api.put<ApiResponse<T>>(`${url}/${id}`, payload)).data,

    remove: async (id: number) => (await api.delete<ApiResponse<null>>(`${url}/${id}`)).data,
  };
}

export type CrudService<T, P> = ReturnType<typeof createCrudService<T, P>>;