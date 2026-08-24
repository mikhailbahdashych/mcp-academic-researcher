import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SessionService } from './session.service';
import { Paper } from '../models/chat.models';

const PAPER = (id: string): Paper => ({
  id,
  title: `Paper ${id}`,
  authors: ['A. Author'],
  year: 2024,
  abstract: '',
});

describe('SessionService', () => {
  let service: SessionService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    // Constructing the service fires the conversation load; answer it with an
    // empty list so the local state under test is the only thing in play.
    service = TestBed.inject(SessionService);
    http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/conversations').flush([]);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  /** Creates a session and returns it with two assistant messages appended. */
  const seed = () => {
    const session = service.createSession('what is attention?');
    http.expectOne('/api/conversations');
    const first = service.addAssistantMessage(session.id);
    const second = service.addAssistantMessage(session.id);
    return { sessionId: session.id, first, second };
  };

  it('setMessagePapers attaches papers to one message only', () => {
    const { sessionId, first, second } = seed();

    service.setMessagePapers(sessionId, second, [PAPER('p1'), PAPER('p2')]);

    const messages = service.getSession(sessionId)!.messages;
    expect(messages.find(m => m.id === second)!.papers!.map(p => p.id)).toEqual([
      'p1',
      'p2',
    ]);
    expect(messages.find(m => m.id === first)!.papers).toBeUndefined();
  });

  it('setMessagePapers replaces the list rather than accumulating', () => {
    const { sessionId, second } = seed();

    service.setMessagePapers(sessionId, second, [PAPER('p1')]);
    service.setMessagePapers(sessionId, second, [PAPER('p2')]);

    const message = service
      .getSession(sessionId)!
      .messages.find(m => m.id === second)!;
    expect(message.papers!.map(p => p.id)).toEqual(['p2']);
  });

  it('setMessagePapers leaves the session-level source list alone', () => {
    const { sessionId, second } = seed();

    service.setMessagePapers(sessionId, second, [PAPER('p1')]);

    // The rail is fed by addPapers; per-message papers are only for citations.
    expect(service.getSession(sessionId)!.papers).toEqual([]);
  });

  it('setMessagePapers ignores an unknown session or message', () => {
    const { sessionId, first, second } = seed();

    service.setMessagePapers('no-such-session', second, [PAPER('p1')]);
    service.setMessagePapers(sessionId, 'no-such-message', [PAPER('p1')]);

    const messages = service.getSession(sessionId)!.messages;
    expect(messages.find(m => m.id === first)!.papers).toBeUndefined();
    expect(messages.find(m => m.id === second)!.papers).toBeUndefined();
  });
});
