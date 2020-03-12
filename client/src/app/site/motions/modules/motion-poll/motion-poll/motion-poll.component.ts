import { Component, Input } from '@angular/core';
import { MatDialog, MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { MotionPollRepositoryService } from 'app/core/repositories/motions/motion-poll-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { VotingPrivacyWarningComponent } from 'app/shared/components/voting-privacy-warning/voting-privacy-warning.component';
import { PollType } from 'app/shared/models/poll/base-poll';
import { infoDialogSettings } from 'app/shared/utils/dialog-settings';
import { ViewMotionPoll } from 'app/site/motions/models/view-motion-poll';
import { MotionPollDialogService } from 'app/site/motions/services/motion-poll-dialog.service';
import { MotionPollPdfService } from 'app/site/motions/services/motion-poll-pdf.service';
import { MotionPollService } from 'app/site/motions/services/motion-poll.service';
import { BasePollComponent } from 'app/site/polls/components/base-poll.component';
import { PollService, PollTableData } from 'app/site/polls/services/poll.service';

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
        this.chartDataSubject.next(chartData);
    }

    public get poll(): ViewMotionPoll {
        return this._poll;
    }

    public get pollLink(): string {
        return `/motions/polls/${this.poll.id}`;
    }

    public get showChart(): boolean {
        return this.motionPollService.showChart(this.poll);
    }

    public get hideChangeState(): boolean {
        return this.poll.isPublished || (this.poll.isCreated && this.poll.type === PollType.Analog);
    }

    public get reducedPollTableData(): PollTableData[] {
        return this.motionPollService
            .generateTableData(this.poll)
            .filter(data => ['yes', 'no', 'abstain', 'votesinvalid'].includes(data.votingOption));
    }

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
        protected translate: TranslateService,
        dialog: MatDialog,
        promptService: PromptService,
        public pollRepo: MotionPollRepositoryService,
        pollDialog: MotionPollDialogService,
        public pollService: PollService,
        private pdfService: MotionPollPdfService,
        private motionPollService: MotionPollService
    ) {
        super(titleService, matSnackBar, translate, dialog, promptService, pollRepo, pollDialog);
    }

    public openVotingWarning(): void {
        this.dialog.open(VotingPrivacyWarningComponent, infoDialogSettings);
    }

    public downloadPdf(): void {
        this.pdfService.printBallots(this.poll);
    }

    public async deletePoll(): Promise<void> {
        const title = this.translate.instant('Are you sure you want to delete this vote?');
        const content = this.poll.getTitle();

        if (await this.promptService.open(title, content)) {
            this.repo.delete(this.poll).catch(this.raiseError);
        }
    }
}
