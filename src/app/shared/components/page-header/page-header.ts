import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-header', standalone: true, imports: [RouterLink],
  template: `<nav class="breadcrumb" aria-label="Navegação estrutural"><a routerLink="/dashboard">Atlas Carteira</a><span aria-hidden="true">›</span><span aria-current="page">{{ title }}</span></nav>
    <header class="page-header"><div><p class="eyebrow">{{ eyebrow }}</p><h1>{{ title }}</h1>@if (description) { <p class="description">{{ description }}</p> }</div><div class="actions"><ng-content /></div></header>`,
  styles: [`.breadcrumb{display:flex;align-items:center;flex-wrap:wrap;gap:var(--space-2);margin-bottom:var(--space-5);color:var(--color-text-muted);font-size:var(--font-size-sm)}.breadcrumb a{display:inline-flex;min-height:24px;align-items:center;color:var(--color-action)}.page-header{display:flex;align-items:flex-end;justify-content:space-between;gap:var(--space-5);margin-bottom:var(--space-5)}.eyebrow{margin:0 0 var(--space-2);color:var(--color-action);font-size:var(--font-size-xs);font-weight:850;letter-spacing:.12em;text-transform:uppercase}h1{margin:0;color:var(--color-navy);font-size:clamp(var(--font-size-xl),4vw,var(--font-size-2xl));line-height:1.15;letter-spacing:-.035em}.description{max-width:48rem;margin:var(--space-2) 0 0;color:var(--color-text-muted)}.actions{display:flex;flex-wrap:wrap;gap:var(--space-2)}@media(max-width:40rem){.page-header{align-items:stretch;flex-direction:column}.actions>*{width:100%}}`],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() eyebrow = 'Área de investimentos';
  @Input() description = '';
}
