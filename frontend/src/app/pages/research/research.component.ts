import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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

  sessionId = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.sessionId = params.get('sessionId') ?? '';
    });
  }
}
