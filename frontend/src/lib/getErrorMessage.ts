import { isAxiosError } from 'axios';
import type { ValidationErrors } from '../types/api';

export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (!error.response) return 'Cannot reach the server.';
    if (error.response.status === 429) return 'Too many requests. Please wait a moment and try again.';
    return error.response.data?.message ?? 'Something went wrong.';
  }
  return 'Something went wrong.';
}

export function getValidationErrors(error: unknown): ValidationErrors {
  if (isAxiosError(error) && error.response?.status === 422) {
    return error.response.data?.errors ?? {};
  }
  return {};
}