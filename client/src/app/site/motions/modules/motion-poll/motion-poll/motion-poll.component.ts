import { Component, Input } from '@angular/core';
import { MatDialog, MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { MotionPollRepositoryService } from 'app/core/repositories/motions/motion-poll-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { ViewMotionPoll } from 'app/site/motions/models/view-motion-poll';
import { MotionPollDialogService } from 'app/site/motions/services/motion-poll-dialog.service';
import { MotionPollPdfService } from 'app/site/motions/services/motion-poll-pdf.service';
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

        const chartData = this.pollService.generateChartData(value);
        for (const data of chartData) {
            if (data.label === 'YES') {
                this.voteYes = data.data[0];
            }
            if (data.label === 'NO') {
                this.voteNo = data.data[0];
            }
            if (data.label === 'ABSTAIN') {
                this.voteAbstain = data.data[0];
            }
        }
        this.chartDataSubject.next(chartData);
    }

    public get poll(): ViewMotionPoll {
        return this._poll;
    }

    public get pollLink(): string {
        return `/motions/polls/${this.poll.id}`;
    }

    /**
     * Number of votes for `Yes`.
     */
    public set voteYes(n: number) {
        this._voteYes = n;
    }

    public get voteYes(): number {
        return this._voteYes;
    }

    /**
     * Number of votes for `No`.
     */
    public set voteNo(n: number) {
        this._voteNo = n;
    }

    public get voteNo(): number {
        return this._voteNo;
    }

    /**
     * Number of votes for `Abstain`.
     */
    public set voteAbstain(n: number) {
        this._voteAbstain = n;
    }

    public get voteAbstain(): number {
        return this._voteAbstain;
    }

    public get showChart(): boolean {
        return this._voteYes >= 0 && this._voteNo >= 0;
    }

    private _voteNo: number;

    private _voteYes: number;

    private _voteAbstain: number;

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
        private pdfService: MotionPollPdfService
    ) {
        super(titleService, matSnackBar, translate, dialog, promptService, pollRepo, pollDialog);
    }

    public downloadPdf(): void {
        this.pdfService.printBallots(this.poll);
    }

    public async deletePoll(): Promise<void> {
        const title = 'Delete poll';
        const text = 'Do you really want to delete the selected poll?';

        if (await this.promptService.open(title, text)) {
            this.repo.delete(this.poll).catch(this.raiseError);
        }
    }
}
