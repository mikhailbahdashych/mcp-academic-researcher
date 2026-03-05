import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SessionService } from '@core/services/session.service';
import { SearchHeroComponent } from './search-hero/search-hero.component';
import { SuggestedTopicsComponent } from './suggested-topics/suggested-topics.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [SearchHeroComponent, SuggestedTopicsComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly router = inject(Router);
  private readonly sessionService = inject(SessionService);

  onQuerySubmit(query: string): void {
    const session = this.sessionService.createSession(query);
    this.router.navigate(['/research', session.id]);
  }
}
