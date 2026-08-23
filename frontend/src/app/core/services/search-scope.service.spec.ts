import { TestBed } from '@angular/core/testing';
import { SearchScopeService } from './search-scope.service';

describe('SearchScopeService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  function create(): SearchScopeService {
    return TestBed.inject(SearchScopeService);
  }

  it('enables both sources by default', () => {
    const service = create();
    expect(service.sources()).toEqual(['arxiv', 'openalex']);
    expect(service.isEnabled('arxiv')).toBeTrue();
    expect(service.isEnabled('openalex')).toBeTrue();
  });

  it('toggles a source off and back on', () => {
    const service = create();

    service.toggle('arxiv');
    expect(service.sources()).toEqual(['openalex']);
    expect(service.isEnabled('arxiv')).toBeFalse();

    service.toggle('arxiv');
    expect(service.sources()).toEqual(['arxiv', 'openalex']);
  });

  it('ignores toggling the last enabled source', () => {
    const service = create();

    service.toggle('arxiv');
    service.toggle('openalex');

    expect(service.sources()).toEqual(['openalex']);
  });

  it('persists the scope to localStorage and restores it', () => {
    create().toggle('openalex');
    expect(JSON.parse(localStorage.getItem('mcp_search_sources') ?? '[]')).toEqual(['arxiv']);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    expect(TestBed.inject(SearchScopeService).sources()).toEqual(['arxiv']);
  });
});
