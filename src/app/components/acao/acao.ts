import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AcaoService, Acao } from '../../services/acao';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { parseApiError } from '../../services/api-error';

@Component({
  selector: 'app-acao',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './acao.html',
  styleUrl: './acao.css'
})
export class AcaoComponent implements OnInit {
  acoes: Acao[] = [];
  tickerDigitado: string = '';
  mercadoSelecionado: string = 'BRASIL'; // Antes estava 'BRASILEIRO'
  mensagemErro: string = '';
  errosCampos: Record<string, string> = {};
  carregando = false;
  cargaFalhou = false;
  dadosDesatualizados = false;
  salvando = false;
  atualizando = new Set<number>();

  constructor(
    private acaoService: AcaoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarAcoes();
  }

  carregarAcoes(): void {
    this.carregando = true;
    this.cargaFalhou = false;
    this.acaoService.listar().subscribe({
      next: (dados) => {
        this.acoes = dados;
        this.dadosDesatualizados = false;
        this.carregando = false;
        this.cdr.detectChanges();
      },
      error: (erro) => {
        this.carregando = false;
        this.cargaFalhou = true;
        this.dadosDesatualizados = this.acoes.length > 0;
        this.mensagemErro = parseApiError(erro).message;
        this.cdr.detectChanges();
      }
    });
  }

  adicionarAcao(): void {
    if (this.salvando) return;
    if (!this.tickerDigitado || !this.mercadoSelecionado) {
      this.mensagemErro = 'Preencha o Ticker e o Mercado.';
      this.cdr.detectChanges();
      return;
    }

    this.mensagemErro = '';
    this.errosCampos = {};

    this.salvando = true;
    this.acaoService.salvar(this.tickerDigitado, this.mercadoSelecionado).pipe(
      finalize(() => { this.salvando = false; this.cdr.detectChanges(); })
    ).subscribe({
      next: () => {
        this.tickerDigitado = '';
        this.carregarAcoes();
      },
      error: (erro) => {
        const parsed = parseApiError(erro);
        this.mensagemErro = parsed.message;
        this.errosCampos = parsed.fields;
        this.cdr.detectChanges();
      }
    });
  }

  atualizarPreco(id: number | undefined): void {
    if (!id || this.atualizando.has(id)) return;
    this.atualizando.add(id);

    this.acaoService.atualizarCotacao(id).pipe(
      finalize(() => { this.atualizando.delete(id); this.cdr.detectChanges(); })
    ).subscribe({
      next: () => this.carregarAcoes(),
      error: (erro) => {
        this.mensagemErro = parseApiError(erro).message;
        this.cdr.detectChanges();
      }
    });
  }
}
