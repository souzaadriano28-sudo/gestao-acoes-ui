import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Availability, DashboardReadModel, DetailedPosition, Movement } from '../../core/portfolio/portfolio.models';
import { PortfolioReadService } from '../../core/portfolio/portfolio-read.service';
import { AsyncReadFacade, stateData } from '../../shared/state/async-state';
import { AsyncRegionComponent } from '../../shared/components/async-region/async-region';
import { CurrencyValueComponent } from '../../shared/components/currency-value/currency-value';
import { DateTimeValueComponent } from '../../shared/components/date-time-value/date-time-value';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';
import { PartialDataStateComponent } from '../../shared/components/partial-data-state/partial-data-state';
import { QuoteProvenanceComponent } from '../../shared/components/quote-provenance/quote-provenance';
import { ResponsiveDataListComponent } from '../../shared/components/responsive-data-list/responsive-data-list';
import { SummaryCardComponent } from '../../shared/components/summary-card/summary-card';
import { DataStatusComponent } from '../../shared/components/data-status/data-status';
import { AtlasIconComponent } from '../../shared/components/atlas-icon/atlas-icon';

@Component({
  selector: 'app-dashboard', standalone: true,
  imports: [RouterLink, AsyncRegionComponent, CurrencyValueComponent, DateTimeValueComponent, EmptyStateComponent,
    PageHeaderComponent, PartialDataStateComponent, QuoteProvenanceComponent, ResponsiveDataListComponent,
    SummaryCardComponent, DataStatusComponent, AtlasIconComponent],
  templateUrl: './dashboard.html', styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly facade = new AsyncReadFacade<DashboardReadModel>();
  constructor(private readonly reads: PortfolioReadService) {}
  ngOnInit(): void { this.refresh(); }
  ngOnDestroy(): void { this.facade.destroy(); }
  refresh(): void { this.facade.load(() => this.reads.dashboard()); }
  get data(): DashboardReadModel | undefined { return stateData(this.facade.state()); }
  get hasPartialData(): boolean {
    const data = this.data;
    if (!data || data.positionCount === 0) return false;
    return [data.patrimony, data.cost, data.unrealizedResult, data.unrealizedResultPercentage, data.exchangeSource,
      ...data.quoteSources].some(item => item.availability !== 'AVAILABLE' && !this.isExpectedAbsence(item.reason));
  }
  get qualityAvailability(): Availability {
    const data = this.data;
    if (this.facade.state().status === 'stale') return 'STALE';
    if (!data) return 'UNAVAILABLE';
    const states = [data.patrimony, data.cost, data.unrealizedResult, data.unrealizedResultPercentage,
      data.exchangeSource, ...data.quoteSources].filter(item => !this.isExpectedAbsence(item.reason));
    if (states.some(item => item.availability === 'UNAVAILABLE')) return 'UNAVAILABLE';
    if (states.some(item => item.availability === 'STALE')) return 'STALE';
    return 'AVAILABLE';
  }
  get qualitySummary(): string {
    return this.qualityAvailability === 'AVAILABLE' ? 'Fontes atualizadas'
      : this.qualityAvailability === 'STALE' ? 'Há dados desatualizados' : 'Há dados indisponíveis';
  }
  private isExpectedAbsence(reason: string | null): boolean {
    return reason === 'EMPTY_PORTFOLIO' || reason === 'NOT_REQUIRED' || reason === 'NOT_REQUIRED_FOR_EMPTY_PORTFOLIO';
  }
  positionKey(position: DetailedPosition): number { return position.positionId; }
  movementKey(movement: Movement): number { return movement.id; }
}
