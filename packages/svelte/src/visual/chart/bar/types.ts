export interface BarChartBar {
	label: string;
	value: number;
}

export interface BarChartProps {
	title?: string;
	bars?: BarChartBar[];
	yAxisLabel?: string;
	valueFormat?: (value: number) => string;
	className?: string;
}
