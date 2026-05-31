import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Acao {
  id?: number;
  ticker: string;
  nomeEmpresa?: string;
  mercado: string;
  moeda?: string;
  cotacaoAtual?: number;
  dataHoraCotacao?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AcaoService {
  private apiUrl = 'http://localhost:8080/acoes';

  constructor(private http: HttpClient) { }

  listar(): Observable<Acao[]> {
    return this.http.get<Acao[]>(this.apiUrl);
  }

  salvar(tickerDigitado: string, mercadoSelecionado: string): Observable<Acao> {
    const payload = {
      ticker: tickerDigitado,
      mercado: mercadoSelecionado
    };
    return this.http.post<Acao>(this.apiUrl, payload);
  }

  atualizarCotacao(id: number): Observable<Acao> {
    return this.http.put<Acao>(`${this.apiUrl}/${id}/atualizar-cotacao`, {});
  }
}
