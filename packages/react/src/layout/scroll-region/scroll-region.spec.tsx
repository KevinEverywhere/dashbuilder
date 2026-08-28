import { render, screen } from '@testing-library/react';
import { ScrollRegion } from './ScrollRegion.js';

describe('ScrollRegion', () => {
  it('renders with taxonomy-aligned BEM root block', () => {
    render(<ScrollRegion>Content</ScrollRegion>);
    expect(screen.getByTestId('rd-scroll-region')).toBeTruthy();
  });

  it('forwards ref', () => {
    const ref = { current: null as HTMLElement | null };
    render(<ScrollRegion ref={ref}>Content</ScrollRegion>);
    expect(ref.current).toBeTruthy();
  });

  it('applies maxHeight and overlay scrollbar class', () => {
    render(
      <ScrollRegion title="About Destination Atlas" maxHeight="24rem">
        Content
      </ScrollRegion>,
    );
    const region = screen.getByTestId('rd-scroll-region');
    expect(region.getAttribute('aria-label')).toBe('About Destination Atlas');
    expect(region.className).toContain('rd-scroll-region--overlay-scrollbar');
    expect((region as HTMLElement).style.maxHeight).toBe('24rem');
  });
});
