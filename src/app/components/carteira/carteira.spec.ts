import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';
import { CarteiraComponent } from './carteira';

describe('CarteiraComponent', () => {
  const asset = { id: 1, ticker: 'PETR4', mercado: 'BRASIL' };
  let carteira: any;
  let corretora: any;
  let acao: any;
  let component: CarteiraComponent;

  beforeEach(() => {
    carteira = {
      comprar: vi.fn(() => of(void 0)), vender: vi.fn(() => of(void 0)),
      getSaldoTotal: vi.fn(() => of(100)), listarPosicoes: vi.fn(() => of([]))
    };
    corretora = { listar: vi.fn(() => of([{ id: 7, cnpj: '11222333000181' }])) };
    acao = { listar: vi.fn(() => of([asset])) };
    component = new CarteiraComponent(carteira, corretora, acao, { detectChanges: vi.fn() } as any);
    component.acaoSelecionada = asset;
    component.corretoraIdSelecionada = 7;
    component.quantidade = 1;
  });

  it('recusa quantidade fracionária localmente', () => {
    component.quantidade = 1.5;
    component.executarTransacao();
    expect(carteira.comprar).not.toHaveBeenCalled();
  });

  it('bloqueia clique repetido e mudança de operação enquanto o POST está pendente', () => {
    const response = new Subject<void>();
    carteira.comprar.mockReturnValue(response);
    component.executarTransacao();
    component.executarTransacao();
    component.selecionarTipo('VENDA');
    expect(carteira.comprar).toHaveBeenCalledTimes(1);
    expect(component.tipoOperacao).toBe('COMPRA');
    response.error(new HttpErrorResponse({ status: 422, error: { message: 'recusada', fieldErrors: [] } }));
    expect(component.operacaoPendente).toBe(false);
  });

  it('distingue operação recusada e associa erros de campo', () => {
    carteira.comprar.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 422, error: {
      message: 'Revise', fieldErrors: [{ field: 'qtd', message: 'inválida' }]
    }})));
    component.executarTransacao();
    expect(component.mensagemErro).toBe('Revise');
    expect(component.errosCampos['qtd']).toBe('inválida');
  });

  it('mantém confirmação e avisa quando a atualização posterior falha', () => {
    carteira.getSaldoTotal.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 503 })));
    component.executarTransacao();
    expect(component.mensagemSucesso).toContain('sucesso');
    expect(component.mensagemAviso).toContain('confirmada');
  });

  it('trata perda de comunicação como resultado desconhecido sem retry automático', () => {
    carteira.comprar.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    component.executarTransacao();
    expect(component.mensagemErro).toContain('confirmar o resultado');
    expect(carteira.comprar).toHaveBeenCalledTimes(1);
    expect(component.quantidade).toBe(1);
  });

  it('não apresenta zero fictício na falha inicial e preserva dados antigos na falha posterior', () => {
    carteira.getSaldoTotal.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 503 })));
    component.carregarDashboard();
    expect(component.saldoTotal).toBeNull();
    expect(component.cargaFalhou).toBe(true);

    component.saldoTotal = 100;
    component.posicoes = [{ ticker: 'PETR4', corretora: 'Teste', quantidade: 1, precoMedio: 20, moeda: 'BRL' }];
    component.carregarDashboard();
    expect(component.saldoTotal).toBe(100);
    expect(component.dadosDesatualizados).toBe(true);
  });
});
