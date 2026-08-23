import { Component } from '@angular/core';

/** Placeholder shell — replaced by the real provider/model settings page. */
@Component({
  selector: 'app-settings',
  standalone: true,
  template: `
    <div class="page">
      <h1 class="page-title">Settings</h1>
      <p class="text-secondary">Coming soon.</p>
    </div>
  `,
  styles: [
    `
      .page {
        padding: 36px 48px;
        max-width: var(--content-max-width);
      }

      .page-title {
        font: 600 28px/1.2 var(--font-display);
        margin: 0 0 10px;
      }
    `,
  ],
})
export class SettingsComponent {}
