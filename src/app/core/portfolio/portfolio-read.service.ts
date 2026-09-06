import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  DashboardReadModel,
  DetailedPosition,
  Movement,
  MovementQuery,
  PageResponse,
  PositionQuery
} from './portfolio.models';

@Injectable({ providedIn: 'root' })
export class PortfolioReadService {
  private readonly baseUrl = '/api/carteira';

  constructor(private readonly http: HttpClient) {}

  dashboard(): Observable<DashboardReadModel> {
    return this.http.get<DashboardReadModel>(`${this.baseUrl}/dashboard`);
  }

  detailedPositions(query: PositionQuery = {}): Observable<PageResponse<DetailedPosition>> {
    return this.http.get<PageResponse<DetailedPosition>>(`${this.baseUrl}/posicoes/detalhadas`, {
      params: queryParams(query)
    });
  }

  movements(query: MovementQuery = {}): Observable<PageResponse<Movement>> {
    return this.http.get<PageResponse<Movement>>(`${this.baseUrl}/movimentacoes`, {
      params: queryParams(query)
    });
  }
}

function queryParams(query: PositionQuery | MovementQuery): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
  }
  return params;
}
