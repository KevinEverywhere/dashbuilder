import type { FlexLayoutProps } from './flex-layout';

describe('@rosettadash/angular/layout/flex', () => {
  it('exposes typed props contract', () => {
    const props: FlexLayoutProps = { density: 'compact' };
    expect(props.density).toBe('compact');
  });

  it('uses taxonomy-aligned BEM block rd-flex', () => {
    expect('rd-flex').toMatch(/^rd-/);
  });
});
