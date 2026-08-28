export interface DateRangeFilterProps {
  label?: string;
  startDate?: string;
  endDate?: string;
  presetLabel?: string;
  granularity?: 'date' | 'month';
  onChange?: (range: { startDate: string; endDate: string }) => void;
  className?: string;
}
