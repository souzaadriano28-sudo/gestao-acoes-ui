import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Acao {
  id?: number;
  ticker: string;
  nomeEmpresa?: string;
  mercado: 'BRASIL' | 'AMERICANO';
  moeda?: string;
  cotacaoAtual?: number;
  dataHoraCotacao?: string;
  quoteSourceType?: string | null;
  quoteProvider?: string | null;
  quoteReferenceAt?: string | null;
  quoteFetchedAt?: string | null;
  quoteReferenceKind?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AcaoService {
  private readonly apiUrl = '/api/acoes';

  constructor(private http: HttpClient) { }

  listar(): Observable<Acao[]> {
    return this.http.get<Acao[]>(this.apiUrl);
  }

  salvar(tickerDigitado: string, mercadoSelecionado: 'BRASIL' | 'AMERICANO'): Observable<Acao> {
    const payload = {
      ticker: tickerDigitado,
      mercado: mercadoSelecionado
    };
    return this.http.post<Acao>(this.apiUrl, payload);
  }

  consultar(ticker: string, mercado: 'BRASIL' | 'AMERICANO'): Observable<Acao> {
    return this.http.get<Acao>(`${this.apiUrl}/consulta`, { params: { ticker, mercado } });
  }

  atualizarCotacao(id: number): Observable<Acao> {
    return this.http.put<Acao>(`${this.apiUrl}/${id}/atualizar-cotacao`, {});
  }
}
