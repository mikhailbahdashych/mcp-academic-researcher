import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SearchScopeService } from '@core/services/search-scope.service';
import { SettingsService } from '@core/services/settings.service';

/**
 * Shared composer used both as the home hero input and as the follow-up bar.
 *
 * `size='hero'` adds the source-scope chips, the ⌘K hint and the global ⌘K
 * focus shortcut; `size='inline'` renders the compact follow-up variant.
 */
@Component({
  selector: 'app-query-input',
  standalone: true,
  imports: [FormsModule, RouterLink, TextFieldModule, MatTooltipModule],
  templateUrl: './query-input.component.html',
  styleUrl: './query-input.component.scss',
})
export class QueryInputComponent implements AfterViewInit {
  @Input() size: 'hero' | 'inline' = 'hero';
  /** Overrides the size-derived default placeholder when set. */
  @Input() placeholder = '';
  @Input() disabled = false;

  @Output() querySubmit = new EventEmitter<string>();

  @ViewChild('textarea') textareaRef!: ElementRef<HTMLTextAreaElement>;

  protected readonly scope = inject(SearchScopeService);
  protected readonly settings = inject(SettingsService);

  query = '';

  /** Matches the provider radio-cards on the Settings page. */
  protected get providerIcon(): string {
    return this.settings.currentProvider() === 'anthropic' ? 'auto_awesome' : 'memory';
  }

  protected get placeholderText(): string {
    if (this.placeholder) return this.placeholder;
    return this.size === 'hero' ? 'Ask a research question...' : 'Ask a follow-up...';
  }

  /**
   * The hero composer autofocuses so that ⌘K from another route — which routes
   * back to home — lands the caret in the composer. The follow-up bar never
   * steals focus.
   */
  ngAfterViewInit(): void {
    if (this.size === 'hero') this.focus();
  }

  /** ⌘K / Ctrl+K focuses the hero composer (the follow-up bar never steals focus). */
  @HostListener('document:keydown', ['$event'])
  onGlobalKey(event: KeyboardEvent): void {
    if (this.size !== 'hero') return;
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.focus();
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submit();
    }
  }

  submit(): void {
    const q = this.query.trim();
    if (!q || this.disabled) return;
    this.querySubmit.emit(q);
    this.query = '';
  }

  focus(): void {
    this.textareaRef?.nativeElement.focus();
  }
}
