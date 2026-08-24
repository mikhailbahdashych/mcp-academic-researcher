import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CitationFocusService } from '@core/services/citation-focus.service';
import { Message, Paper } from '@core/models/chat.models';
import { MessageBubbleComponent } from './message-bubble.component';

const PAPER = (id: string): Paper => ({
  id,
  title: `Paper ${id}`,
  authors: [],
  year: 2024,
  abstract: '',
});

const ANSWER = (papers?: Paper[]): Message => ({
  id: 'm1',
  role: 'assistant',
  content: 'See [1] and [2].',
  timestamp: new Date(),
  papers,
});

describe('MessageBubbleComponent citation resolution', () => {
  let component: MessageBubbleComponent;
  let focus: jasmine.SpyObj<CitationFocusService>;

  beforeEach(() => {
    focus = jasmine.createSpyObj<CitationFocusService>('CitationFocusService', [
      'focus',
      'focusPaper',
    ]);
    TestBed.configureTestingModule({
      providers: [
        MessageBubbleComponent,
        { provide: CitationFocusService, useValue: focus },
        { provide: MatSnackBar, useValue: { open: () => undefined } },
      ],
    });
    component = TestBed.inject(MessageBubbleComponent);
  });

  it('resolves a citation number against this message own source list', () => {
    component.message = ANSWER([PAPER('p1'), PAPER('p2')]);

    component.onCiteClick(2);

    expect(focus.focusPaper).toHaveBeenCalledOnceWith('p2');
    expect(focus.focus).not.toHaveBeenCalled();
  });

  it('falls back to the positional index when the message carries no papers', () => {
    component.message = ANSWER();

    component.onCiteClick(2);

    expect(focus.focus).toHaveBeenCalledOnceWith(2);
    expect(focus.focusPaper).not.toHaveBeenCalled();
  });

  it('falls back when the number runs past this message source list', () => {
    component.message = ANSWER([PAPER('p1')]);

    component.onCiteClick(3);

    expect(focus.focus).toHaveBeenCalledOnceWith(3);
    expect(focus.focusPaper).not.toHaveBeenCalled();
  });
});
