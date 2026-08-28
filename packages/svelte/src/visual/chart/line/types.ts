export interface LineChartPoint {
	x: string | number;
	y: number;
}

export interface LineChartProps {
	title?: string;
	points?: LineChartPoint[];
	xAxisLabel?: string;
	yAxisLabel?: string;
	valueFormat?: (value: number) => string;
	className?: string;
}
