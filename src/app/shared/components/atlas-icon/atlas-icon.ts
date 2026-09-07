import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type AtlasIconName = 'dashboard' | 'portfolio' | 'assets' | 'brokers' | 'operations' | 'refresh' | 'plus';

@Component({
  selector: 'app-atlas-icon',
  standalone: true,
  template: `<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    @switch (name) {
      @case ('dashboard') { <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 17.5h7M17.5 14v7"/> }
      @case ('portfolio') { <path d="M4 7.5h16v11H4z"/><path d="M7 7.5V5h10v2.5M4 11h16"/><path d="M15 14h4v2.5h-4z"/> }
      @case ('assets') { <path d="M5 20V10M10 20V5M15 20v-7M20 20V3"/><path d="M3 20h19"/> }
      @case ('brokers') { <path d="M3 9l9-6 9 6M5 10v9M9 10v9M15 10v9M19 10v9M3 20h18"/><path d="M11 7h2"/> }
      @case ('operations') { <path d="M5 7h14M16 4l3 3-3 3M19 17H5M8 14l-3 3 3 3"/> }
      @case ('refresh') { <path d="M20 11a8 8 0 1 0 1 5M20 4v7h-7"/> }
      @case ('plus') { <path d="M12 5v14M5 12h14"/> }
    }
  </svg>`,
  styles: [':host{display:inline-grid;width:1.25rem;height:1.25rem;flex:0 0 1.25rem;place-items:center}svg{display:block;width:100%;height:100%;fill:none;stroke:currentColor;stroke-width:1.75;stroke-linecap:round;stroke-linejoin:round}'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AtlasIconComponent { @Input({ required: true }) name!: AtlasIconName; }
