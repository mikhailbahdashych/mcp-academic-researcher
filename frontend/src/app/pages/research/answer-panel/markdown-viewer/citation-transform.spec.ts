import { wrapCitations } from './citation-transform';

describe('wrapCitations', () => {
  it('wraps [n] within range', () => {
    expect(wrapCitations('see [1] and [2].', 2)).toBe(
      'see <a class="citation-chip" data-cite="1">1</a> and <a class="citation-chip" data-cite="2">2</a>.'
    );
  });

  it('leaves out-of-range and code alone', () => {
    expect(wrapCitations('x [9]', 2)).toBe('x [9]');
    expect(wrapCitations('<code>[1]</code>', 2)).toBe('<code>[1]</code>');
  });

  it('leaves text inside <pre> and <a> alone', () => {
    expect(wrapCitations('<pre>[1]</pre>', 2)).toBe('<pre>[1]</pre>');
    expect(wrapCitations('<a href="#">[1]</a>', 2)).toBe('<a href="#">[1]</a>');
  });

  it('splits comma lists', () => {
    expect(wrapCitations('a [1, 3]', 3)).toContain('data-cite="1"');
    expect(wrapCitations('a [1, 3]', 3)).toContain('data-cite="3"');
  });

  it('wraps adjacent [1][2] as two chips', () => {
    expect(wrapCitations('a [1][2]', 2)).toBe(
      'a <a class="citation-chip" data-cite="1">1</a><a class="citation-chip" data-cite="2">2</a>'
    );
  });

  it('leaves text unchanged when max is 0', () => {
    expect(wrapCitations('see [1] and [2].', 0)).toBe('see [1] and [2].');
  });

  it('ignores [0]', () => {
    expect(wrapCitations('a [0]', 3)).toBe('a [0]');
  });

  it('wraps citations in ordinary markup but not in nested code', () => {
    expect(wrapCitations('<p>ok [1]</p><pre><code>[2]</code></pre>', 2)).toBe(
      '<p>ok <a class="citation-chip" data-cite="1">1</a></p><pre><code>[2]</code></pre>'
    );
  });
});
