import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  HostListener,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-query-input',
  standalone: true,
  imports: [FormsModule, TextFieldModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './query-input.component.html',
  styleUrl: './query-input.component.scss',
})
export class QueryInputComponent implements OnInit {
  @Input() size: 'hero' | 'inline' = 'hero';
  @Input() placeholder = 'Ask a research question...';
  @Input() disabled = false;

  @Output() querySubmit = new EventEmitter<string>();

  @ViewChild('textarea') textareaRef!: ElementRef<HTMLTextAreaElement>;

  query = '';

  ngOnInit(): void {
    if (this.size === 'hero') {
      this.placeholder = 'Ask anything about research papers...';
    } else {
      this.placeholder = 'Ask a follow-up question...';
    }
  }

  /** Cmd+K global shortcut focuses the hero input */
  @HostListener('document:keydown', ['$event'])
  onGlobalKey(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.textareaRef?.nativeElement.focus();
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
