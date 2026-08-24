import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from '@core/services/theme.service';

@Component({
  selector: 'app-sidebar-footer',
  standalone: true,
  imports: [MatTooltipModule],
  templateUrl: './sidebar-footer.component.html',
  styleUrl: './sidebar-footer.component.scss',
})
export class SidebarFooterComponent {
  @Input() collapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();

  protected readonly themeService = inject(ThemeService);
}
