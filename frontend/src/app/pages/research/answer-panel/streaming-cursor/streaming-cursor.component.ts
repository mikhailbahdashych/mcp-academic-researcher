import { Component } from '@angular/core';

@Component({
  selector: 'app-streaming-cursor',
  standalone: true,
  template: `<span class="cursor" aria-hidden="true"></span>`,
  styles: [`
    .cursor {
      display: inline-block;
      width: 2px;
      height: 1.1em;
      background: #1DE9B6;
      border-radius: 1px;
      vertical-align: text-bottom;
      margin-left: 1px;
      animation: blink 0.9s step-end infinite;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
  `],
})
export class StreamingCursorComponent {}
