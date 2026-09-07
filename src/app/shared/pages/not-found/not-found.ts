import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found', standalone: true, imports: [RouterLink],
  template: '<section><p class="code">404</p><h1>Página não encontrada</h1><p>O endereço informado não corresponde a uma área do Atlas Carteira.</p><a routerLink="/dashboard">Voltar ao Dashboard</a></section>',
  styles: ['section{position:relative;max-width:38rem;margin:clamp(2rem,10vh,7rem) auto;padding:var(--space-6);overflow:hidden;border:1px solid var(--color-border);border-radius:var(--radius-lg);background:white;text-align:center;box-shadow:var(--shadow-sm)}section::after{position:absolute;right:-5rem;bottom:-5rem;width:10rem;height:10rem;border:1px solid var(--color-action-soft);border-radius:50%;content:""}.code{margin:0;color:var(--color-action);font-size:var(--font-size-sm);font-weight:850;letter-spacing:.12em}h1{margin:var(--space-2) 0;color:var(--color-navy);font-size:var(--font-size-xl)}section>p:not(.code){color:var(--color-text-muted)}a{position:relative;z-index:1;display:inline-flex;align-items:center;justify-content:center;min-height:var(--target-comfortable);margin-top:var(--space-3);padding:0 var(--space-4);border-radius:var(--radius-sm);background:var(--color-action);color:white;font-weight:750;text-decoration:none}'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotFoundComponent {}
