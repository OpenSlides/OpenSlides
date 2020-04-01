import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { ChartOptions } from 'chart.js';
import { Label } from 'ng2-charts';

import { BaseViewComponent } from 'app/site/base/base-view';

/**
 * The different supported chart-types.
 */
export type ChartType = 'doughnut' | 'pie' | 'horizontalBar';

/**
 * One single collection in an array.
 */
export interface ChartDate {
    data: number[];
    label: string;
    backgroundColor?: string;
    hoverBackgroundColor?: string;
    barThickness?: number;
    maxBarThickness?: number;
}

/**
 * An alias for an array of `ChartDate`.
 */
export type ChartData = ChartDate[];

/**
 * Wrapper for the chart-library.
 *
 * It takes the passed data to fit the different types of the library.
 */
@Component({
    selector: 'os-charts',
    templateUrl: './charts.component.html',
    styleUrls: ['./charts.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChartsComponent extends BaseViewComponent {
    /**
     * The type of the chart.
     */
    @Input()
    public type: ChartType = 'horizontalBar';

    /**
     * The labels for the separated sections.
     * Each label represent one section, e.g. one year.
     */
    @Input()
    public labels: Label[];

    /**
     * Show a legend
     */
    @Input()
    public legend = false;

    /**
     * Required since circle charts demand SingleDataSet-Objects
     */
    public circleColors: { backgroundColor?: string[]; hoverBackgroundColor?: string[] }[];

    /**
     * The general data for the chart.
     * This is only needed for `type == 'bar' || 'line'`
     */
    public chartData: ChartData;

    @Input()
    public set data(inputData: ChartData) {
        this.progressInputData(inputData);
    }

    /**
     * The options used for the charts.
     */
    public get chartOptions(): ChartOptions {
        if (this.isCircle) {
            return {
                responsive: true,
                maintainAspectRatio: false,
                tooltips: {
                    enabled: false
                },
                legend: {
                    position: 'left'
                }
            };
        } else {
            return {
                responsive: true,
                maintainAspectRatio: false,
                tooltips: {
                    enabled: false
                },
                scales: {
                    xAxes: [
                        {
                            gridLines: {
                                drawOnChartArea: false
                            },
                            ticks: { beginAtZero: true, stepSize: 1 },
                            stacked: true
                        }
                    ],
                    yAxes: [
                        {
                            gridLines: {
                                drawBorder: false,
                                drawOnChartArea: false,
                                drawTicks: false
                            },
                            ticks: { mirror: true, labelOffset: -20 },
                            stacked: true
                        }
                    ]
                }
            };
        }
    }

    public get isCircle(): boolean {
        return this.type === 'pie' || this.type === 'doughnut';
    }

    /**
     * Constructor.
     *
     * @param title
     * @param translate
     * @param matSnackbar
     * @param cd
     */
    public constructor(title: Title, translate: TranslateService, matSnackbar: MatSnackBar) {
        super(title, translate, matSnackbar);
    }

    public calcBarChartHeight(): string | undefined {
        if (!this.isCircle) {
            const baseHeight = 120;
            const perLabel = 60;
            return `${baseHeight + perLabel * this.labels.length}px`;
        } else {
            return undefined;
        }
    }

    private progressInputData(inputChartData: ChartData): void {
        if (this.isCircle) {
            this.chartData = inputChartData.flatMap(chartDate => chartDate.data);
            this.circleColors = [
                {
                    backgroundColor: inputChartData
                        .map(chartDate => chartDate.backgroundColor)
                        .filter(color => !!color),
                    hoverBackgroundColor: inputChartData
                        .map(chartDate => chartDate.hoverBackgroundColor)
                        .filter(color => !!color)
                }
            ];
        } else {
            this.chartData = inputChartData;
        }

        if (!this.labels) {
            this.labels = inputChartData.map(chartDate => chartDate.label);
        }
    }
}
