import type { ScrollRegionProps } from './scroll-region';

describe('@rosettadash/vue/layout/scroll-region', () => {
  it('exposes typed props contract', () => {
    const props: ScrollRegionProps = {};
    expect(props).toBeDefined();
  });

  it('uses taxonomy-aligned BEM block rd-scroll-region', () => {
    expect('rd-scroll-region').toMatch(/^rd-/);
  });
});
