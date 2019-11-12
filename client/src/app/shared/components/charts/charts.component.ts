import { Component, EventEmitter, Input, Output } from '@angular/core';
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
export type ChartType = 'line' | 'bar' | 'pie' | 'doughnut' | 'horizontalBar';

/**
 * Describes the events the chart is fired, when hovering or clicking on it.
 */
interface ChartEvent {
    event: MouseEvent;
    active: {}[];
}

/**
 * One single collection in an arry.
 */
export interface ChartDate {
    data: number[];
    label: string;
    backgroundColor?: string;
    hoverBackgroundColor?: string;
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
    styleUrls: ['./charts.component.scss']
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
                this.chartData = data;
                this.circleData = data.flatMap((date: ChartDate) => date.data);
                this.circleLabels = data.map(date => date.label);
                this.circleColors = [
                    {
                        backgroundColor: data.map(date => date.backgroundColor),
                        hoverBackgroundColor: data.map(date => date.hoverBackgroundColor)
                    }
                ];
            })
        );
    }

    /**
     * The type of the chart. Defaults to `'bar'`.
     */
    @Input()
    public set type(type: ChartType) {
        if (type === 'horizontalBar') {
            this.setupHorizontalBar();
        }
        this._type = type;
    }

    public get type(): ChartType {
        return this._type;
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
            labels: {
                fontSize: 14
            }
        },
        scales: { xAxes: [{}], yAxes: [{ ticks: { beginAtZero: true } }] },
        plugins: {
            datalabels: {
                anchor: 'end',
                align: 'end'
            }
        }
    };

    /**
     * Holds the type of the chart - defaults to `bar`.
     */
    private _type: ChartType = 'bar';

    /**
     * Constructor.
     *
     * @param title
     * @param translate
     * @param matSnackbar
     * @param cd
     */
    public constructor(title: Title, protected translate: TranslateService, matSnackbar: MatSnackBar) {
        super(title, translate, matSnackbar);
    }

    /**
     * Changes the chart-options, if the `horizontalBar` is used.
     */
    private setupHorizontalBar(): void {
        this.chartOptions.scales = Object.assign(this.chartOptions.scales, {
            xAxes: [{ stacked: true }],
            yAxes: [{ stacked: true }]
        });
    }
}
