import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CarteiraService, TransacaoRequest, Posicao } from '../../services/carteira';
import { CorretoraService, Corretora } from '../../services/corretora';
import { AcaoService, Acao } from '../../services/acao';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-carteira',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './carteira.html',
  styleUrl: './carteira.css'
})
export class CarteiraComponent implements OnInit {
  saldoTotal: number = 0;

  corretoras: Corretora[] = [];
  acoes: Acao[] = [];
  posicoes: Posicao[] = [];

  tipoOperacao: 'COMPRA' | 'VENDA' = 'COMPRA';
  acaoSelecionada: any = '';
  corretoraIdSelecionada: number | '' = '';
  quantidade: number | null = null;

  mensagemSucesso: string = '';
  mensagemErro: string = '';

  constructor(
    private carteiraService: CarteiraService,
    private corretoraService: CorretoraService,
    private acaoService: AcaoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarDashboard();
  }

  carregarDashboard(): void {
    this.carteiraService.getSaldoTotal().subscribe({
      next: (saldo) => { this.saldoTotal = saldo; this.cdr.detectChanges(); },
      error: (e) => console.error('Erro ao buscar saldo:', e)
    });

    this.carteiraService.listarPosicoes().subscribe({
      next: (dados) => { this.posicoes = dados; this.cdr.detectChanges(); },
      error: (e) => console.error('Erro ao buscar posições:', e)
    });

    this.corretoraService.listar().subscribe(dados => this.corretoras = dados);
    this.acaoService.listar().subscribe(dados => this.acoes = dados);
  }

  executarTransacao(): void {
    this.mensagemSucesso = '';
    this.mensagemErro = '';

    if (!this.acaoSelecionada || !this.corretoraIdSelecionada || !this.quantidade || this.quantidade <= 0) {
      this.mensagemErro = 'Preencha todos os campos corretamente com uma quantidade válida.';
      this.cdr.detectChanges();
      return;
    }

    const payload: TransacaoRequest = {
      ticker: this.acaoSelecionada.ticker,
      mercado: this.acaoSelecionada.mercado,
      qtd: this.quantidade,
      corretoraId: Number(this.corretoraIdSelecionada)
    };

    const operacao = this.tipoOperacao === 'COMPRA'
      ? this.carteiraService.comprar(payload)
      : this.carteiraService.vender(payload);

    operacao.subscribe({
      next: () => {
        this.mensagemSucesso = `${this.tipoOperacao} de ${this.quantidade} cotas de ${payload.ticker} realizada com sucesso!`;
        this.quantidade = null;
        this.carregarDashboard();
      },
      error: (erro) => {
        this.mensagemErro = erro.error?.message || erro.error || 'Erro ao processar a transação.';
        this.cdr.detectChanges();
      }
    });
  }
}
