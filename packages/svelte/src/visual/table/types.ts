export interface DataTableRow {
  id: string;
  name?: string;
  status?: string;
  amount?: string | number;
  date?: string;
  [key: string]: string | number | undefined;
}

export interface DataTableProps {
  title?: string;
  rows?: DataTableRow[];
  selectedRowId?: string;
  onRowSelect?: (rowId: string) => void;
  className?: string;
}
