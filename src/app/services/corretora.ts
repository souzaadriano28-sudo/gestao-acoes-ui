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
  email?: string;
  telefone?: string;
  numero?: string;
  complemento?: string;
  situacaoCadastral?: string;
  dataCadastro?: string;
  businessRegistration?: { source: string; status: string | null; reason: string | null };
  regulatoryEvidence?: RegulatoryEvidence;
}

export type RegulatoryStatus = 'NOT_CHECKED' | 'VERIFIED' | 'NOT_FOUND' | 'INACTIVE' | 'INCOMPATIBLE' | 'STALE' | 'UNAVAILABLE';
export interface RegulatoryEvidence {
  status: RegulatoryStatus;
  category: string | null;
  source: string | null;
  evidenceId: string | null;
  referenceAt: string | null;
  checkedAt: string | null;
  reason: string | null;
}

export interface BrokerCnpjPreview {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  situacaoEmpresarial: string;
  cepSugerido: string | null;
  cnaeCompativel: boolean;
  autorizadaPelaCvm: boolean;
  situacaoCvm: string;
  categoriaCvm: string | null;
  consultadaEm: string;
  mensagemCvm: string | null;
}

export interface BrokerAddressPreview {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface BrokerRegistrationRequest {
  cnpj: string;
  cep: string;
  numero?: string;
  complemento?: string;
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

  consultarCnpj(cnpj: string): Observable<BrokerCnpjPreview> {
    return this.http.post<BrokerCnpjPreview>(`${this.apiUrl}/consultas/cnpj`, { cnpj });
  }

  consultarCep(cep: string): Observable<BrokerAddressPreview> {
    return this.http.post<BrokerAddressPreview>(`${this.apiUrl}/consultas/cep`, { cep });
  }

  salvar(payload: BrokerRegistrationRequest): Observable<Corretora> {
    return this.http.post<Corretora>(this.apiUrl, payload);
  }

  atualizarEvidencias(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/evidencia-regulatoria/atualizar`, {});
  }
}
