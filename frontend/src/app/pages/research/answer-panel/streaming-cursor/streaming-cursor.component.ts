import { Component } from '@angular/core';

/** Blinking 2px accent bar shown at the tail of a streaming answer. */
@Component({
  selector: 'app-streaming-cursor',
  standalone: true,
  template: `<span class="cursor" aria-hidden="true"></span>`,
  styles: [`
    .cursor {
      display: inline-block;
      width: 2px;
      height: 1.05em;
      background: var(--accent-color);
      border-radius: 1px;
      vertical-align: -2px;
      margin-left: 3px;
      animation: blink 0.9s step-end infinite;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
  `],
})
export class StreamingCursorComponent {}
