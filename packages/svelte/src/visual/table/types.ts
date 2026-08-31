export interface DataTableRow {
  id: string;
  name?: string;
  status?: string;
  amount?: string | number;
  date?: string;
  [key: string]: string | number | undefined;
}

export interface DataTableColumn {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  width?: string;
  format?: (value: unknown, row: DataTableRow) => string;
}

export interface DataTableProps {
  title?: string;
  rows?: DataTableRow[];
  columns?: DataTableColumn[];
  selectedRowId?: string;
  onRowSelect?: (rowId: string) => void;
  className?: string;
}
