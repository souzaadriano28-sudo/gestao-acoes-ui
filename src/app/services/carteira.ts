import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TransacaoRequest {
  ticker: string;
  mercado: string;
  qtd: number;
  corretoraId: number;
}

export interface Posicao {
  ticker: string;
  corretora: string;
  quantidade: number;
  precoMedio: number;
  moeda: string; // <-- Agora o Angular sabe a moeda!
}

export interface OperationRequest {
  tipo: 'COMPRA' | 'VENDA'; ativoId: number; corretoraId: number; dataHora: string; quantidade: number;
  moeda: string; precoUnitario: number; corretagem?: number; taxas?: number; impostos?: number;
  outrosCustos?: number; observacao?: string; idempotencyKey?: string;
}
export interface OperationPreview {
  quantidadeAnterior: number; precoMedioAnterior: number; custoAnterior: number; valorBruto: number;
  custos: number; valorTotal: number; quantidadeProjetada: number; precoMedioProjetado: number;
  custoProjetado: number; resultadoRealizadoProjetado: number; moeda: string;
}
export interface OperationRecord extends OperationRequest { id: number; ticker: string; corretora: string; valorBruto: number; valorTotal: number; }

@Injectable({
  providedIn: 'root'
})
export class CarteiraService {
  private readonly apiUrl = '/api/carteira';

  constructor(private http: HttpClient) { }

  comprar(transacao: TransacaoRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/comprar`, transacao);
  }

  vender(transacao: TransacaoRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/vender`, transacao);
  }

  getSaldoTotal(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/saldo-total`);
  }

  listarPosicoes(): Observable<Posicao[]> {
    return this.http.get<Posicao[]>(`${this.apiUrl}/posicoes`);
  }

  previa(operation: OperationRequest): Observable<OperationPreview> { return this.http.post<OperationPreview>('/api/operacoes/previa', operation); }
  registrar(operation: OperationRequest): Observable<OperationRecord> { return this.http.post<OperationRecord>('/api/operacoes', operation); }
  atualizar(id: number, operation: OperationRequest): Observable<OperationRecord> { return this.http.put<OperationRecord>(`/api/operacoes/${id}`, operation); }
  excluir(id: number): Observable<void> { return this.http.delete<void>(`/api/operacoes/${id}`); }
  historico(params: Record<string, string | number> = {}): Observable<OperationRecord[]> { return this.http.get<OperationRecord[]>('/api/operacoes', { params: params as any }); }
}
