import { render, screen } from '@testing-library/react';
import { BarChart } from './BarChart.js';

describe('BarChart', () => {
  it('renders with taxonomy-aligned BEM root block', () => {
    render(<BarChart />);
    expect(screen.getByTestId('rd-chart-bar')).toBeTruthy();
  });

  it('forwards ref', () => {
    const ref = { current: null as HTMLElement | null };
    render(<BarChart ref={ref} />);
    expect(ref.current).toBeTruthy();
  });

  it('renders provided bar labels', () => {
    render(<BarChart title="2024 visitors" bars={[{ label: 'Cusco', value: 12 }]} />);
    expect(screen.getByRole('img', { name: '2024 visitors' })).toBeTruthy();
    expect(screen.getByText('Cusco')).toBeTruthy();
  });
});
