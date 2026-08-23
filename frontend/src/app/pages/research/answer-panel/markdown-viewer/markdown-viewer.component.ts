import {
  Component,
  HostListener,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MarkdownService } from 'ngx-markdown';
import { CitationFocusService } from '@core/services/citation-focus.service';
import { wrapCitations } from './citation-transform';

/**
 * Renders assistant markdown and turns `[n]` markers into clickable citation chips.
 *
 * Parsing goes through ngx-markdown's `MarkdownService` (same trust level as the
 * `<markdown>` component it replaces — the content is our own backend's LLM output),
 * then `wrapCitations` rewrites the citation markers and the result is bound with
 * `[innerHTML]`. Clicking a chip asks the sources rail to reveal that source.
 */
@Component({
  selector: 'app-markdown-viewer',
  standalone: true,
  template: `<div class="markdown-content" [innerHTML]="rendered"></div>`,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class MarkdownViewerComponent implements OnChanges {
  @Input() content = '';
  /** Number of sources in the session; markers above it stay plain text. */
  @Input() maxCitations = 0;

  protected rendered: SafeHtml = '';

  private readonly markdownService = inject(MarkdownService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly citationFocus = inject(CitationFocusService);

  /** Guards against an out-of-order async parse overwriting a newer render. */
  private renderToken = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['content'] || changes['maxCitations']) this.render();
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    const chip = (event.target as HTMLElement | null)?.closest?.('[data-cite]');
    if (!chip) return;
    event.preventDefault();
    const index = Number(chip.getAttribute('data-cite'));
    if (Number.isInteger(index) && index > 0) this.citationFocus.focus(index);
  }

  private render(): void {
    const token = ++this.renderToken;
    const parsed = this.markdownService.parse(this.content ?? '');

    if (typeof parsed === 'string') {
      this.apply(parsed);
    } else {
      parsed.then(html => {
        if (token === this.renderToken) this.apply(html);
      });
    }
  }

  private apply(html: string): void {
    // Safe to bypass: `html` comes from MarkdownService.parse(), which has
    // already run Angular's sanitizer (SecurityContext.HTML — the
    // provideMarkdown() default; nothing here sets disableSanitizer), and
    // wrapCitations() only inserts fixed <a data-cite="N"> anchors whose N is
    // digit-only. Do not feed this method HTML from any other source.
    this.rendered = this.sanitizer.bypassSecurityTrustHtml(
      wrapCitations(html, this.maxCitations)
    );
  }
}
