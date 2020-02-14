import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { ChartOptions } from 'chart.js';
import { Label } from 'ng2-charts';
import { Observable } from 'rxjs';

import { BaseViewComponent } from 'app/site/base/base-view';

/**
 * The different supported chart-types.
 */
export type ChartType = 'line' | 'bar' | 'pie' | 'doughnut' | 'horizontalBar' | 'stackedBar';

/**
 * Describes the events the chart is fired, when hovering or clicking on it.
 */
interface ChartEvent {
    event: MouseEvent;
    active: {}[];
}

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

export type ChartLegendSize = 'small' | 'middle';

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
     * Sets the data as an observable.
     *
     * The data is prepared and splitted to dynamic use of bar/line or doughnut/pie chart.
     */
    @Input()
    public set data(dataObservable: Observable<ChartData>) {
        this.subscriptions.push(
            dataObservable.subscribe(data => {
                if (!data) {
                    return;
                }
                data = data.flatMap((date: ChartDate) => ({ ...date, data: date.data.filter(value => value >= 0) }));
                this.chartData = data;
                this.circleData = data.flatMap((date: ChartDate) => date.data);
                this.circleLabels = data.map(date => date.label);
                const circleColors = [
                    {
                        backgroundColor: data.map(date => date.backgroundColor).filter(color => !!color),
                        hoverBackgroundColor: data.map(date => date.hoverBackgroundColor).filter(color => !!color)
                    }
                ];
                this.circleColors = !!circleColors[0].backgroundColor.length ? circleColors : null;
                this.checkChartType();
                this.cd.detectChanges();
            })
        );
    }

    /**
     * The type of the chart. Defaults to `'bar'`.
     */
    @Input()
    public set type(type: ChartType) {
        this.checkChartType(type);
        this.cd.detectChanges();
    }

    public get type(): ChartType {
        return this._type;
    }

    @Input()
    public set chartLegendSize(size: ChartLegendSize) {
        this._chartLegendSize = size;
        this.setupChartLegendSize();
    }

    /**
     * Whether to show the legend.
     */
    @Input()
    public showLegend = true;

    /**
     * The labels for the separated sections.
     * Each label represent one section, e.g. one year.
     */
    @Input()
    public labels: Label[] = [];

    /**
     * Sets the position of the legend.
     * Defaults to `'top'`.
     */
    @Input()
    public set legendPosition(position: Chart.PositionType) {
        this.chartOptions.legend.position = position;
    }

    /**
     * Determine, if the chart has some padding at the borders.
     */
    @Input()
    public hasPadding = true;

    /**
     * Optional passing a number as percentage value for `max-width`.
     * Range from 1 to 100.
     * Defaults to `100`.
     */
    @Input()
    public set size(size: number) {
        if (size > 100) {
            size = 100;
        }
        if (size < 1) {
            size = 1;
        }
        this._size = size;
    }

    public get size(): number {
        return this._size;
    }

    /**
     * Fires an event, when the user clicks on the chart.
     */
    @Output()
    public select = new EventEmitter<ChartEvent>();

    /**
     * Fires an event, when the user hovers over the chart.
     */
    @Output()
    public hover = new EventEmitter<ChartEvent>();

    /**
     * Returns a string to append to the `chart-wrapper's` classes.
     */
    public get classes(): string {
        return 'os-charts os-charts--' + this.size;
    }

    /**
     * The general data for the chart.
     * This is only needed for `type == 'bar' || 'line'`
     */
    public chartData: ChartData = [];

    /**
     * The data for circle-like charts, like 'doughnut' or 'pie'.
     */
    public circleData: number[] = [];

    /**
     * The labels for circle-like charts, like 'doughnut' or 'pie'.
     */
    public circleLabels: Label[] = [];

    /**
     * The colors for circle-like charts, like 'doughnut' or 'pie'.
     */
    public circleColors: { backgroundColor?: string[]; hoverBackgroundColor?: string[] }[] = [];

    /**
     * The options used for the charts.
     */
    public chartOptions: ChartOptions = {
        responsive: true,
        legend: {
            position: 'top',
            labels: {}
        },
        scales: {
            xAxes: [{ ticks: { beginAtZero: true, stepSize: 1 } }],
            yAxes: [{ ticks: { beginAtZero: true } }]
        },
        plugins: {
            datalabels: {
                anchor: 'end',
                align: 'end'
            }
        }
    };

    /**
     * Chart option for pie and doughnut
     */
    @Input()
    public pieChartOptions: ChartOptions = {
        aspectRatio: 1
    };

    /**
     * Holds the type of the chart - defaults to `bar`.
     */
    private _type: ChartType = 'bar';

    private _chartLegendSize: ChartLegendSize = 'middle';

    /**
     * Holds the value for `max-width`.
     */
    private _size = 100;

    /**
     * Constructor.
     *
     * @param title
     * @param translate
     * @param matSnackbar
     * @param cd
     */
    public constructor(
        title: Title,
        protected translate: TranslateService,
        matSnackbar: MatSnackBar,
        private cd: ChangeDetectorRef
    ) {
        super(title, translate, matSnackbar);
    }

    /**
     * Changes the chart-options, if the `stackedBar` is used.
     */
    private setupStackedBar(): void {
        this.chartOptions.scales = Object.assign(this.chartOptions.scales, {
            xAxes: [{ stacked: true }],
            yAxes: [{ stacked: true }]
        });
    }

    private setupBar(): void {
        if (!this.chartData.every(date => date.barThickness && date.maxBarThickness)) {
            this.chartData = this.chartData.map(chartDate => ({
                ...chartDate,
                barThickness: 20,
                maxBarThickness: 48
            }));
        }
    }

    private setupChartLegendSize(): void {
        switch (this._chartLegendSize) {
            case 'small':
                this.chartOptions.legend.labels = Object.assign(this.chartOptions.legend.labels, {
                    fontSize: 10,
                    boxWidth: 20
                });
                break;
            case 'middle':
                this.chartOptions.legend.labels = {
                    fontSize: 14,
                    boxWidth: 40
                };
                break;
        }
        this.cd.detectChanges();
    }

    private checkChartType(chartType?: ChartType): void {
        let type = chartType || this._type;
        if (type === 'stackedBar') {
            this.setupStackedBar();
            this.setupBar();
            type = 'horizontalBar';
        }
        this._type = type;
    }
}
