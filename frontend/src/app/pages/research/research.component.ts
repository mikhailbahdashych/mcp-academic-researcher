import { Component, OnInit, effect, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../../core/services/session.service';
import { AnswerPanelComponent } from './answer-panel/answer-panel.component';
import { SourcesPanelComponent } from './sources-panel/sources-panel.component';

@Component({
  selector: 'app-research',
  standalone: true,
  imports: [AnswerPanelComponent, SourcesPanelComponent],
  templateUrl: './research.component.html',
  styleUrl: './research.component.scss',
})
export class ResearchComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sessionService = inject(SessionService);

  sessionId = '';

  constructor() {
    effect(() => {
      const sessions = this.sessionService.sessions();
      if (this.sessionId && !sessions.find(s => s.id === this.sessionId)) {
        this.router.navigate(['/']);
      }
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.sessionId = params.get('sessionId') ?? '';
    });
  }
}
