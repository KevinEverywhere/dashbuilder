export interface NewsResultsRow {
  id: string;
  headline?: string;
  source?: string;
  region?: string;
  published?: string;
  url?: string;
}

export interface NewsResultsTableProps {
  title?: string;
  className?: string;
  rows?: NewsResultsRow[];
  selectedRowId?: string;
  onRowSelect?: (rowId: string) => void;
}
