/**
 * Helper centralizado para respostas de API padronizadas
 */

import { NextResponse } from "next/server";

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Resposta de sucesso padronizada
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  );
}

/**
 * Resposta de erro padronizada
 */
export function errorResponse(
  error: string,
  status: number = 400,
  code?: string,
  details?: any
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(code && { code }),
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * Resposta de acesso negado (403)
 */
export function forbiddenResponse(
  message: string = "Acesso negado"
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 403, "FORBIDDEN");
}

/**
 * Resposta de não autenticado (401)
 */
export function unauthorizedResponse(
  message: string = "Não autenticado"
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 401, "UNAUTHORIZED");
}

/**
 * Resposta de não encontrado (404)
 */
export function notFoundResponse(
  message: string = "Recurso não encontrado"
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 404, "NOT_FOUND");
}

