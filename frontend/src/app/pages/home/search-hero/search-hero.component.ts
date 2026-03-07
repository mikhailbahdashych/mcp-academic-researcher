import { Component, EventEmitter, Output } from '@angular/core';
import { QueryInputComponent } from '@shared/components/query-input/query-input.component';

@Component({
  selector: 'app-search-hero',
  standalone: true,
  imports: [QueryInputComponent],
  templateUrl: './search-hero.component.html',
  styleUrl: './search-hero.component.scss',
})
export class SearchHeroComponent {
  @Output() querySubmit = new EventEmitter<string>();
}
