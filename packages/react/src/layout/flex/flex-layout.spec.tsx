import { render, screen } from '@testing-library/react';
import { FlexLayout } from './FlexLayout.js';

describe('FlexLayout', () => {
  it('renders with taxonomy-aligned BEM root block', () => {
    render(<FlexLayout />);
    expect(screen.getByTestId('rd-flex')).toBeTruthy();
  });

  it('forwards ref', () => {
    const ref = { current: null as HTMLElement | null };
    render(<FlexLayout ref={ref} />);
    expect(ref.current).toBeTruthy();
  });

  it('applies compact density on the root', () => {
    render(<FlexLayout density="compact" />);
    expect(screen.getByTestId('rd-flex').className).toContain('rd-flex--compact');
  });
});
