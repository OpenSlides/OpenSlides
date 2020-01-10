import { Component, Input } from '@angular/core';
import { MatDialog, MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

import { MotionPollRepositoryService } from 'app/core/repositories/motions/motion-poll-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { ChartData } from 'app/shared/components/charts/charts.component';
import { ViewMotionPoll } from 'app/site/motions/models/view-motion-poll';
import { MotionPollDialogService } from 'app/site/motions/services/motion-poll-dialog.service';
import { BasePollComponent } from 'app/site/polls/components/base-poll.component';
import { PollService } from 'app/site/polls/services/poll.service';

/**
 * Component to show a motion-poll.
 */
@Component({
    selector: 'os-motion-poll',
    templateUrl: './motion-poll.component.html',
    styleUrls: ['./motion-poll.component.scss']
})
export class MotionPollComponent extends BasePollComponent<ViewMotionPoll> {
    /**
     * The dedicated `ViewMotionPoll`.
     * TODO: shadows superclass `poll`. Maybe change when chart data is generated?
     */
    @Input()
    public set poll(value: ViewMotionPoll) {
        this._poll = value;

        const chartData = this.poll.generateChartData();
        for (const data of chartData) {
            if (data.label === 'YES') {
                this.voteYes = data.data[0];
            }
            if (data.label === 'NO') {
                this.voteNo = data.data[0];
            }
        }
        this.chartDataSubject.next(chartData);
    }

    public get poll(): ViewMotionPoll {
        return this._poll;
    }

    /**
     * Subject to holding the data needed for the chart.
     */
    public chartDataSubject: BehaviorSubject<ChartData> = new BehaviorSubject([]);

    /**
     * Number of votes for `Yes`.
     */
    public voteYes = 0;

    /**
     * Number of votes for `No`.
     */
    public voteNo = 0;

    /**
     * The motion-poll.
     */
    private _poll: ViewMotionPoll;

    /**
     * Constructor.
     *
     * @param title
     * @param translate
     * @param matSnackbar
     * @param router
     * @param motionRepo
     */
    public constructor(
        titleService: Title,
        matSnackBar: MatSnackBar,
        translate: TranslateService,
        dialog: MatDialog,
        promptService: PromptService,
        public pollRepo: MotionPollRepositoryService,
        pollDialog: MotionPollDialogService,
        public pollService: PollService
    ) {
        super(titleService, matSnackBar, translate, dialog, promptService, pollRepo, pollDialog);
    }
}
