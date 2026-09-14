import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { OperacaoService, OperationRequestDTO } from './operacao';

describe('OperacaoService', () => {
  let service: OperacaoService;
  let http: HttpTestingController;
  beforeEach(() => { TestBed.configureTestingModule({ providers: [OperacaoService, provideHttpClient(), provideHttpClientTesting()] }); service = TestBed.inject(OperacaoService); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());

  it('serializa prévia e cadastro no contrato do ledger', () => {
    const payload: OperationRequestDTO = { tipo: 'COMPRA', ativoId: 1, corretoraId: 7, dataHora: '2026-09-12T10:30:00', quantidade: 2, moeda: 'BRL', precoUnitario: 10.25, corretagem: 0.1, taxas: 0.2, impostos: 0.3, outrosCustos: 0.4, observacao: 'Aporte', idempotencyKey: 'key-1' };
    service.preview(payload).subscribe();
    const preview = http.expectOne('/api/operacoes/previa');
    expect(preview.request.method).toBe('POST');
    expect(preview.request.body).toEqual(payload);
    preview.flush({ quantidadeAnterior: 0, precoMedioAnterior: 0, custoAnterior: 0, valorBruto: 20.5, custos: 1, valorTotal: 21.5, quantidadeProjetada: 2, precoMedioProjetado: 10.75, custoProjetado: 21.5, resultadoRealizadoProjetado: 0, moeda: 'BRL' });
    service.create(payload).subscribe();
    const create = http.expectOne('/api/operacoes');
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual(payload);
    create.flush({});
  });

  it('serializa prévia de edição, atualização e exclusão pelos endpoints do ledger', () => {
    const payload: OperationRequestDTO = { tipo: 'VENDA', ativoId: 1, corretoraId: 7, dataHora: '2026-09-12T10:30:00', quantidade: 2, moeda: 'BRL', precoUnitario: 15, corretagem: 1, taxas: 0, impostos: 0, outrosCustos: 0, observacao: 'Venda parcial' };
    service.previewUpdate(11, payload).subscribe();
    const preview = http.expectOne('/api/operacoes/11/previa');
    expect(preview.request.method).toBe('POST'); expect(preview.request.body).toEqual(payload); preview.flush({});
    service.update(11, payload).subscribe();
    const update = http.expectOne('/api/operacoes/11');
    expect(update.request.method).toBe('PUT'); expect(update.request.body).toEqual(payload); update.flush({});
    service.delete(11).subscribe();
    const deletion = http.expectOne('/api/operacoes/11');
    expect(deletion.request.method).toBe('DELETE'); deletion.flush(null);
  });
});
