import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type OperationType = 'COMPRA' | 'VENDA';

/** Mirrors the authenticated ledger request accepted by /api/operacoes. */
export interface OperationRequestDTO {
  tipo: OperationType;
  ativoId: number;
  corretoraId: number;
  dataHora: string;
  quantidade: number;
  moeda: string;
  precoUnitario: string | number;
  corretagem?: string | number;
  taxas?: string | number;
  impostos?: string | number;
  outrosCustos?: string | number;
  observacao?: string;
  idempotencyKey?: string;
}

export interface OperationPreviewDTO {
  quantidadeAnterior: number;
  precoMedioAnterior: number;
  custoAnterior: number;
  valorBruto: number;
  custos: number;
  valorTotal: number;
  quantidadeProjetada: number;
  precoMedioProjetado: number;
  custoProjetado: number;
  resultadoRealizadoProjetado: number;
  moeda: string;
}

export interface OperationDTO {
  id: number;
  tipo: OperationType;
  ativoId: number;
  ticker: string;
  corretoraId: number;
  corretora: string;
  quantidade: number;
  moeda: string;
  precoUnitario: number;
  corretagem: number;
  taxas: number;
  impostos: number;
  outrosCustos: number;
  valorBruto: number;
  valorTotal: number;
  resultadoRealizado: number;
  dataHora: string;
  observacao: string | null;
}

export interface OperationHistoryQuery {
  tipo?: OperationType;
  ticker?: string;
  corretoraId?: number;
  de?: string;
  ate?: string;
}

@Injectable({ providedIn: 'root' })
export class OperacaoService {
  private readonly apiUrl = '/api/operacoes';

  constructor(private readonly http: HttpClient) {}

  preview(request: OperationRequestDTO): Observable<OperationPreviewDTO> {
    return this.http.post<OperationPreviewDTO>(`${this.apiUrl}/previa`, request);
  }

  previewUpdate(id: number, request: OperationRequestDTO): Observable<OperationPreviewDTO> {
    return this.http.post<OperationPreviewDTO>(`${this.apiUrl}/${id}/previa`, request);
  }

  create(request: OperationRequestDTO): Observable<OperationDTO> {
    return this.http.post<OperationDTO>(this.apiUrl, request);
  }

  update(id: number, request: OperationRequestDTO): Observable<OperationDTO> {
    return this.http.put<OperationDTO>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  list(query: OperationHistoryQuery = {}): Observable<OperationDTO[]> {
    return this.http.get<OperationDTO[]>(this.apiUrl, { params: queryParams(query) });
  }
}

function queryParams(query: OperationHistoryQuery): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
  }
  return params;
}
