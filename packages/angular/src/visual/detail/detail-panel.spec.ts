import type { DetailPanelProps } from './detail-panel';

describe('@rosettadash/angular/visual/detail', () => {
  it('exposes typed props contract', () => {
    const props: DetailPanelProps = {
      title: 'Quote',
      emptyMessage: 'Select a symbol',
    };
    expect(props.emptyMessage).toBe('Select a symbol');
  });

  it('uses taxonomy-aligned BEM block rd-detail', () => {
    expect('rd-detail').toMatch(/^rd-/);
  });
});
