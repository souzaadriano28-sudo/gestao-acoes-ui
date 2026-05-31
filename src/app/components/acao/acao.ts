import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AcaoService, Acao } from '../../services/acao';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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

  constructor(
    private acaoService: AcaoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarAcoes();
  }

  carregarAcoes(): void {
    this.acaoService.listar().subscribe({
      next: (dados) => {
        this.acoes = dados;
        this.cdr.detectChanges();
      },
      error: (erro) => console.error('Erro ao listar ações:', erro)
    });
  }

  adicionarAcao(): void {
    if (!this.tickerDigitado || !this.mercadoSelecionado) {
      this.mensagemErro = 'Preencha o Ticker e o Mercado.';
      this.cdr.detectChanges();
      return;
    }

    this.mensagemErro = '';

    this.acaoService.salvar(this.tickerDigitado, this.mercadoSelecionado).subscribe({
      next: () => {
        this.tickerDigitado = '';
        this.carregarAcoes();
      },
      error: (erro) => {
        console.error('Erro ao salvar ação:', erro);
        this.mensagemErro = erro.error?.message || erro.error || 'Erro ao buscar o ativo.';
        this.cdr.detectChanges();
      }
    });
  }

  atualizarPreco(id: number | undefined): void {
    if (!id) return;

    this.acaoService.atualizarCotacao(id).subscribe({
      next: () => this.carregarAcoes(),
      error: (erro) => {
        console.error('Erro ao atualizar cotação:', erro);
        this.mensagemErro = 'Não foi possível atualizar o preço neste momento.';
        this.cdr.detectChanges();
      }
    });
  }
}
