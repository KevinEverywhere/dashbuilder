import { render, screen } from '@testing-library/react';
import { DetailPanel } from './DetailPanel.js';

describe('DetailPanel', () => {
  it('renders with taxonomy-aligned BEM root block', () => {
    render(<DetailPanel />);
    expect(screen.getByTestId('rd-detail')).toBeTruthy();
  });

  it('forwards ref', () => {
    const ref = { current: null as HTMLElement | null };
    render(<DetailPanel ref={ref} />);
    expect(ref.current).toBeTruthy();
  });

  it('shows emptyMessage only when there are no children', () => {
    const { rerender } = render(<DetailPanel emptyMessage="Select a row" />);
    expect(screen.getByText('Select a row')).toBeTruthy();
    rerender(
      <DetailPanel emptyMessage="Select a row">
        <p>Filled</p>
      </DetailPanel>,
    );
    expect(screen.queryByText('Select a row')).toBeNull();
    expect(screen.getByText('Filled')).toBeTruthy();
  });
});
