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

@Injectable({
  providedIn: 'root'
})
export class CarteiraService {
  private apiUrl = 'http://localhost:8080/carteira';

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
}
