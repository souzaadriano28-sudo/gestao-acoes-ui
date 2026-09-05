import { HttpErrorResponse } from '@angular/common/http';

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiError {
  timestamp: string;
  status: number;
  code: string;
  error: string;
  message: string;
  path: string;
  fieldErrors: FieldError[];
}

export function parseApiError(error: unknown): { message: string; fields: Record<string, string>; unknownOutcome: boolean } {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as Partial<ApiError> | string | null;
    const fields: Record<string, string> = {};
    if (body && typeof body === 'object' && Array.isArray(body.fieldErrors)) {
      for (const item of body.fieldErrors) {
        if (item?.field && item?.message) fields[item.field] = item.message;
      }
    }
    const message = body && typeof body === 'object' && typeof body.message === 'string'
      ? body.message
      : 'Não foi possível comunicar com o servidor. Tente novamente.';
    return { message, fields, unknownOutcome: error.status === 0 };
  }
  return { message: 'Ocorreu um erro inesperado. Tente novamente.', fields: {}, unknownOutcome: false };
}
