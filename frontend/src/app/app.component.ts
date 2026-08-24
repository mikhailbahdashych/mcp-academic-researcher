import { Component, HostListener, ViewChild, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { TopBarComponent } from './layout/top-bar/top-bar.component';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatSidenavModule, SidebarComponent, TopBarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private static readonly COLLAPSED_KEY = 'sidebar_collapsed';

  @ViewChild('sidenav') sidenav!: MatSidenav;

  protected readonly themeService = inject(ThemeService);

  private readonly breakpointObserver = inject(BreakpointObserver);

  private readonly router = inject(Router);

  readonly isHandset = toSignal(
    this.breakpointObserver
      .observe(Breakpoints.Handset)
      .pipe(map(r => r.matches)),
    { initialValue: false }
  );

  // Collapsed state persisted across sessions
  readonly sidebarCollapsed = signal(
    localStorage.getItem(AppComponent.COLLAPSED_KEY) === 'true'
  );

  /**
   * ⌘K / Ctrl+K from anywhere returns to the home composer. On `/` the hero
   * composer handles the shortcut itself (it just refocuses the textarea).
   */
  @HostListener('document:keydown', ['$event'])
  onGlobalKey(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k' && this.router.url !== '/') {
      event.preventDefault();
      this.router.navigateByUrl('/');
    }
  }

  toggleCollapse(): void {
    this.sidebarCollapsed.update(v => {
      const next = !v;
      localStorage.setItem(AppComponent.COLLAPSED_KEY, String(next));
      return next;
    });
  }

  // Only close the sidenav overlay on mobile; on desktop it stays open
  onSidenavClose(): void {
    if (this.isHandset()) {
      this.sidenav.close();
    }
  }
}
