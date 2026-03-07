import { Component, Input } from '@angular/core';
import { MarkdownComponent } from 'ngx-markdown';

@Component({
  selector: 'app-markdown-viewer',
  standalone: true,
  imports: [MarkdownComponent],
  template: `
    <markdown
      class="markdown-content"
      [data]="content"
    ></markdown>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class MarkdownViewerComponent {
  @Input() content = '';
}
