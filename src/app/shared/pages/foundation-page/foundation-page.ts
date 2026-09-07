import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-foundation-page', standalone: true, imports: [RouterLink],
  template: `<header class="page-header"><p class="eyebrow">Fundação preparada</p><h1>{{ title }}</h1><p>{{ description }}</p></header>
    <section class="notice" role="status"><strong>Conteúdo em construção</strong><p>Esta etapa prepara contratos, navegação e componentes reutilizáveis. Nenhum indicador financeiro é estimado nesta página.</p>@if (link) { <a [routerLink]="link">{{ linkLabel }}</a> }</section>`,
  styles: ['.page-header{max-width:48rem}.eyebrow{margin:0;color:var(--color-action);font-size:var(--font-size-xs);font-weight:800;letter-spacing:.1em;text-transform:uppercase}h1{margin:var(--space-2) 0;font-size:clamp(1.75rem,4vw,2.25rem);line-height:1.15}.page-header>p:last-child{color:var(--color-text-muted)}.notice{max-width:48rem;margin-top:var(--space-6);padding:var(--space-5);border:1px solid var(--color-border);border-radius:var(--radius-lg);background:var(--color-surface);box-shadow:var(--shadow-sm)}.notice p{color:var(--color-text-muted)}a{display:inline-flex;min-height:var(--target-comfortable);align-items:center;color:var(--color-action);font-weight:750}'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FoundationPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly title = this.route.snapshot.data['title'] as string;
  readonly description = this.route.snapshot.data['description'] as string;
  readonly link = (this.route.snapshot.data['link'] as string | undefined) ?? '';
  readonly linkLabel = (this.route.snapshot.data['linkLabel'] as string | undefined) ?? '';
}
