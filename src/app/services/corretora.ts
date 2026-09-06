import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Corretora {
  id?: number;
  razaoSocial?: string;
  nomeFantasia?: string;
  cnpj: string;
  cep?: string;
  logradouro?: string; // <-- Novos campos adicionados
  bairro?: string;
  cidade?: string;
  uf?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CorretoraService {

  private readonly apiUrl = '/api/corretoras';

  constructor(private http: HttpClient) { }

  listar(): Observable<Corretora[]> {
    return this.http.get<Corretora[]>(this.apiUrl);
  }

  salvar(cnpjDigitado: string, cepDigitado: string): Observable<Corretora> {
    const payload = {
      cnpj: cnpjDigitado,
      cep: cepDigitado
    };
    return this.http.post<Corretora>(this.apiUrl, payload);
  }
}
