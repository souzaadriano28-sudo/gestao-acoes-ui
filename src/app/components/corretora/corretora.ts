import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // <-- Importamos o ChangeDetectorRef
import { CorretoraService, Corretora } from '../../services/corretora';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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

  constructor(
    private corretoraService: CorretoraService,
    private cdr: ChangeDetectorRef // <-- Injetamos o atualizador de tela
  ) {}

  ngOnInit(): void {
    this.carregarCorretoras();
  }

  carregarCorretoras(): void {
    this.corretoraService.listar().subscribe({
      next: (dados: Corretora[]) => {
        this.corretoras = dados;
        this.cdr.detectChanges(); // <-- Força a tela a atualizar e mostrar a lista na mesma hora
      },
      error: (erro: any) => {
        console.error('Erro ao listar corretoras:', erro);
      }
    });
  }

  adicionarCorretora(): void {
    if (!this.cnpjCorretora || !this.cepCorretora) {
      this.mensagemErro = 'Preencha o CNPJ e o CEP.';
      this.cdr.detectChanges();
      return;
    }

    this.mensagemErro = '';

    this.corretoraService.salvar(this.cnpjCorretora, this.cepCorretora).subscribe({
      next: () => {
        this.cnpjCorretora = '';
        this.cepCorretora = '';
        this.carregarCorretoras(); // O carregarCorretoras já tem o detectChanges() dentro dele
      },
      error: (erro: any) => {
        console.error('Erro detalhado:', erro);

        // Pega a mensagem de erro exata que o Spring Boot mandou
        if (erro.error && typeof erro.error === 'string') {
          this.mensagemErro = erro.error;
        } else if (erro.error && erro.error.message) {
          this.mensagemErro = erro.error.message;
        } else {
          this.mensagemErro = 'Erro ao processar a requisição. CNPJ duplicado ou inválido.';
        }

        this.cdr.detectChanges(); // <-- Força a tela a exibir a caixa vermelha na mesma hora
      }
    });
  }
}
