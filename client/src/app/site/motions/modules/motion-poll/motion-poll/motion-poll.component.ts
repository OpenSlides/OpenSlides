import { Component, Input } from '@angular/core';
import { MatDialog, MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

import { OperatorService } from 'app/core/core-services/operator.service';
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
        this.initPoll(value);

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
    // public voteYes = 0;
    public set voteYes(n: number | string) {
        this._voteYes = n;
    }

    public get voteYes(): number | string {
        return this.verboseForNumber(this._voteYes as number);
    }

    /**
     * Number of votes for `No`.
     */
    public set voteNo(n: number | string) {
        this._voteNo = n;
    }

    public get voteNo(): number | string {
        return this.verboseForNumber(this._voteNo as number);
    }

    public get showChart(): boolean {
        return this._voteYes >= 0 && this._voteNo >= 0;
    }

    private _voteNo: number | string = 0;

    private _voteYes: number | string = 0;

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
        public pollService: PollService,
        private router: Router,
        private operator: OperatorService
    ) {
        super(titleService, matSnackBar, translate, dialog, promptService, pollRepo, pollDialog);
    }

    public openPoll(): void {
        if (this.operator.hasPerms('motions.can_manage_polls')) {
            this.router.navigate(['motions', 'polls', this.poll.id]);
        }
    }

    private verboseForNumber(input: number): number | string {
        input = Math.trunc(input);
        switch (input) {
            case -1:
                return 'Majority';
            case -2:
                return 'Not documented';
            default:
                return input;
        }
    }
}
