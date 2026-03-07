import { Component, EventEmitter, Output } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

interface Topic {
  label: string;
  icon: string;
  query: string;
}

@Component({
  selector: 'app-suggested-topics',
  standalone: true,
  imports: [MatChipsModule, MatIconModule],
  templateUrl: './suggested-topics.component.html',
  styleUrl: './suggested-topics.component.scss',
})
export class SuggestedTopicsComponent {
  @Output() topicSelect = new EventEmitter<string>();

  readonly topics: Topic[] = [
    {
      label: 'Large language models',
      icon: 'psychology',
      query: 'What are the latest advances in large language models?',
    },
    {
      label: 'Quantum computing',
      icon: 'memory',
      query: 'Recent breakthroughs in quantum computing and error correction',
    },
    {
      label: 'CRISPR gene editing',
      icon: 'biotech',
      query: 'Current state of CRISPR gene editing therapeutic applications',
    },
    {
      label: 'Climate change models',
      icon: 'eco',
      query: 'Latest climate change prediction models and their accuracy',
    },
    {
      label: 'Neuroplasticity',
      icon: 'hub',
      query: 'Neuroplasticity mechanisms and implications for learning',
    },
    {
      label: 'Protein folding',
      icon: 'science',
      query: 'AlphaFold and protein structure prediction advances',
    },
  ];
}
