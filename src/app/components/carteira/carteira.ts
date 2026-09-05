import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { Acao, AcaoService } from '../../services/acao';
import { CarteiraService, Posicao, TransacaoRequest } from '../../services/carteira';
import { Corretora, CorretoraService } from '../../services/corretora';
import { parseApiError } from '../../services/api-error';

@Component({
  selector: 'app-carteira',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './carteira.html',
  styleUrl: './carteira.css'
})
export class CarteiraComponent implements OnInit {
  saldoTotal: number | null = null;
  corretoras: Corretora[] = [];
  acoes: Acao[] = [];
  posicoes: Posicao[] = [];
  tipoOperacao: 'COMPRA' | 'VENDA' = 'COMPRA';
  acaoSelecionada: Acao | '' = '';
  corretoraIdSelecionada: number | '' = '';
  quantidade: number | null = null;
  mensagemSucesso = '';
  mensagemErro = '';
  mensagemAviso = '';
  errosCampos: Record<string, string> = {};
  carregando = false;
  cargaFalhou = false;
  dadosDesatualizados = false;
  operacaoPendente = false;

  constructor(
    private carteiraService: CarteiraService,
    private corretoraService: CorretoraService,
    private acaoService: AcaoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.carregarDashboard(); }

  carregarDashboard(aposOperacao = false): void {
    this.carregando = true;
    this.cargaFalhou = false;
    forkJoin({
      saldo: this.carteiraService.getSaldoTotal(),
      posicoes: this.carteiraService.listarPosicoes(),
      corretoras: this.corretoraService.listar(),
      acoes: this.acaoService.listar()
    }).pipe(finalize(() => { this.carregando = false; this.cdr.detectChanges(); })).subscribe({
      next: ({ saldo, posicoes, corretoras, acoes }) => {
        this.saldoTotal = saldo;
        this.posicoes = posicoes;
        this.corretoras = corretoras;
        this.acoes = acoes;
        this.dadosDesatualizados = false;
        this.cargaFalhou = false;
        this.mensagemAviso = '';
      },
      error: (error) => {
        this.cargaFalhou = true;
        this.dadosDesatualizados = this.saldoTotal !== null || this.posicoes.length > 0;
        const detail = parseApiError(error).message;
        this.mensagemAviso = aposOperacao
          ? `A operação foi confirmada, mas os dados não puderam ser atualizados: ${detail}`
          : detail;
      }
    });
  }

  selecionarTipo(tipo: 'COMPRA' | 'VENDA'): void {
    if (!this.operacaoPendente) this.tipoOperacao = tipo;
  }

  executarTransacao(): void {
    if (this.operacaoPendente) return;
    this.mensagemSucesso = '';
    this.mensagemErro = '';
    this.mensagemAviso = '';
    this.errosCampos = {};

    if (!this.acaoSelecionada || !this.corretoraIdSelecionada || !this.quantidade
        || this.quantidade <= 0 || !Number.isInteger(this.quantidade)) {
      this.mensagemErro = 'Preencha todos os campos com uma quantidade inteira positiva.';
      this.cdr.detectChanges();
      return;
    }

    const payload: TransacaoRequest = {
      ticker: this.acaoSelecionada.ticker,
      mercado: this.acaoSelecionada.mercado,
      qtd: this.quantidade,
      corretoraId: Number(this.corretoraIdSelecionada)
    };
    const operation = this.tipoOperacao === 'COMPRA'
      ? this.carteiraService.comprar(payload)
      : this.carteiraService.vender(payload);

    this.operacaoPendente = true;
    operation.pipe(finalize(() => { this.operacaoPendente = false; this.cdr.detectChanges(); })).subscribe({
      next: () => {
        this.mensagemSucesso = `${this.tipoOperacao} de ${this.quantidade} cotas de ${payload.ticker} realizada com sucesso!`;
        this.quantidade = null;
        this.carregarDashboard(true);
      },
      error: (error) => {
        const parsed = parseApiError(error);
        this.errosCampos = parsed.fields;
        this.mensagemErro = parsed.unknownOutcome
          ? 'Não foi possível confirmar o resultado da operação. Atualize as posições antes de tentar novamente.'
          : parsed.message;
      }
    });
  }
}
