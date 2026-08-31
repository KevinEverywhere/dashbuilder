export type FlexDensity = 'comfortable' | 'compact';

export interface FlexLayoutProps {
  title?: string;
  direction?: 'row' | 'column';
  gap?: number | string;
  density?: FlexDensity;
  className?: string;
}
