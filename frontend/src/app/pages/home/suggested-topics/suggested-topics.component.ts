import { Component, EventEmitter, Output } from '@angular/core';

interface Topic {
  label: string;
  query: string;
}

@Component({
  selector: 'app-suggested-topics',
  standalone: true,
  templateUrl: './suggested-topics.component.html',
  styleUrl: './suggested-topics.component.scss',
})
export class SuggestedTopicsComponent {
  @Output() topicSelect = new EventEmitter<string>();

  readonly topics: Topic[] = [
    {
      label: 'Large language models',
      query: 'What are the latest advances in large language models?',
    },
    {
      label: 'Quantum computing',
      query: 'Recent breakthroughs in quantum computing and error correction',
    },
    {
      label: 'CRISPR gene editing',
      query: 'Current state of CRISPR gene editing therapeutic applications',
    },
    {
      label: 'Climate change models',
      query: 'Latest climate change prediction models and their accuracy',
    },
    {
      label: 'Neuroplasticity',
      query: 'Neuroplasticity mechanisms and implications for learning',
    },
    {
      label: 'Protein folding',
      query: 'AlphaFold and protein structure prediction advances',
    },
  ];
}
