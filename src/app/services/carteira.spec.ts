import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CarteiraService, TransacaoRequest } from './carteira';

describe('CarteiraService', () => {
  let service: CarteiraService;
  let http: HttpTestingController;
  const payload: TransacaoRequest = { ticker: 'PETR4', mercado: 'BRASIL', qtd: 10, corretoraId: 7 };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CarteiraService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('envia compra e venda com método, rota e payload atuais e aceita resposta sem corpo', () => {
    service.comprar(payload).subscribe(value => expect(value).toBeNull());
    const buy = http.expectOne('/api/carteira/comprar');
    expect(buy.request.method).toBe('POST');
    expect(buy.request.body).toEqual(payload);
    buy.flush(null);

    service.vender(payload).subscribe(value => expect(value).toBeNull());
    const sell = http.expectOne('/api/carteira/vender');
    expect(sell.request.method).toBe('POST');
    expect(sell.request.body).toEqual(payload);
    sell.flush(null);
  });

  it('consulta patrimônio e posições', () => {
    service.getSaldoTotal().subscribe(value => expect(value).toBe(1180));
    http.expectOne('/api/carteira/saldo-total').flush(1180.00);
    service.listarPosicoes().subscribe(value => expect(value[0].quantidade).toBe(6));
    http.expectOne('/api/carteira/posicoes')
      .flush([{ ticker: 'PETR4', corretora: 'Teste', quantidade: 6, precoMedio: 20, moeda: 'BRL' }]);
  });
});
