import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the sidebar', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-sidebar')).toBeTruthy();
  });

  it('should start expanded and persist the collapsed state on toggle', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    expect(app.sidebarCollapsed()).toBeFalse();

    app.toggleCollapse();
    expect(app.sidebarCollapsed()).toBeTrue();
    expect(localStorage.getItem('sidebar_collapsed')).toBe('true');

    app.toggleCollapse();
    expect(app.sidebarCollapsed()).toBeFalse();
    expect(localStorage.getItem('sidebar_collapsed')).toBe('false');
  });

  it('should route home on Cmd+K when away from home', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    const navigateByUrl = spyOn(router, 'navigateByUrl');
    spyOnProperty(router, 'url', 'get').and.returnValue('/history');

    const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, cancelable: true });
    document.dispatchEvent(event);

    expect(navigateByUrl).toHaveBeenCalledWith('/');
    expect(event.defaultPrevented).toBeTrue();
  });

  it('should leave Cmd+K to the hero composer while already on home', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    const navigateByUrl = spyOn(router, 'navigateByUrl');
    spyOnProperty(router, 'url', 'get').and.returnValue('/');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));

    expect(navigateByUrl).not.toHaveBeenCalled();
  });
});
