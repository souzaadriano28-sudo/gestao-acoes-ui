import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // <-- Importamos o ChangeDetectorRef
import { CorretoraService, Corretora } from '../../services/corretora';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { parseApiError } from '../../services/api-error';

@Component({
  selector: 'app-corretora',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './corretora.html',
  styleUrl: './corretora.css'
})
export class CorretoraComponent implements OnInit {

  corretoras: Corretora[] = [];
  cnpjCorretora: string = '';
  cepCorretora: string = '';
  mensagemErro: string = '';
  errosCampos: Record<string, string> = {};
  carregando = false;
  cargaFalhou = false;
  dadosDesatualizados = false;
  salvando = false;

  constructor(
    private corretoraService: CorretoraService,
    private cdr: ChangeDetectorRef // <-- Injetamos o atualizador de tela
  ) {}

  ngOnInit(): void {
    this.carregarCorretoras();
  }

  carregarCorretoras(): void {
    this.carregando = true;
    this.cargaFalhou = false;
    this.corretoraService.listar().subscribe({
      next: (dados: Corretora[]) => {
        this.corretoras = dados;
        this.dadosDesatualizados = false;
        this.carregando = false;
        this.cdr.detectChanges(); // <-- Força a tela a atualizar e mostrar a lista na mesma hora
      },
      error: (erro: any) => {
        this.carregando = false;
        this.cargaFalhou = true;
        this.dadosDesatualizados = this.corretoras.length > 0;
        this.mensagemErro = parseApiError(erro).message;
        this.cdr.detectChanges();
      }
    });
  }

  adicionarCorretora(): void {
    if (this.salvando) return;
    if (!this.cnpjCorretora || !this.cepCorretora) {
      this.mensagemErro = 'Preencha o CNPJ e o CEP.';
      this.cdr.detectChanges();
      return;
    }

    this.mensagemErro = '';
    this.errosCampos = {};

    this.salvando = true;
    this.corretoraService.salvar(this.cnpjCorretora, this.cepCorretora).pipe(
      finalize(() => { this.salvando = false; this.cdr.detectChanges(); })
    ).subscribe({
      next: () => {
        this.cnpjCorretora = '';
        this.cepCorretora = '';
        this.carregarCorretoras(); // O carregarCorretoras já tem o detectChanges() dentro dele
      },
      error: (erro: any) => {
        const parsed = parseApiError(erro);
        this.mensagemErro = parsed.message;
        this.errosCampos = parsed.fields;
        this.cdr.detectChanges(); // <-- Força a tela a exibir a caixa vermelha na mesma hora
      }
    });
  }
}
