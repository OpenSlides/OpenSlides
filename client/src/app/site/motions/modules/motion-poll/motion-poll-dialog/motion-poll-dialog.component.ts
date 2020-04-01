import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { LOWEST_VOTE_VALUE } from 'app/shared/models/poll/base-poll';
import { ViewMotionPoll } from 'app/site/motions/models/view-motion-poll';
import { MotionPollService } from 'app/site/motions/services/motion-poll.service';
import { BasePollDialogComponent } from 'app/site/polls/components/base-poll-dialog.component';
import { PollFormComponent } from 'app/site/polls/components/poll-form/poll-form.component';
import { PercentBaseVerbose } from 'app/site/polls/models/view-base-poll';

@Component({
    selector: 'os-motion-poll-dialog',
    templateUrl: './motion-poll-dialog.component.html',
    styleUrls: ['./motion-poll-dialog.component.scss']
})
export class MotionPollDialogComponent extends BasePollDialogComponent<ViewMotionPoll, MotionPollService>
    implements OnInit {
    public PercentBaseVerbose = PercentBaseVerbose;

    @ViewChild('pollForm', { static: false })
    protected pollForm: PollFormComponent<ViewMotionPoll, MotionPollService>;

    public constructor(
        title: Title,
        translate: TranslateService,
        matSnackbar: MatSnackBar,
        public motionPollService: MotionPollService,
        public dialogRef: MatDialogRef<BasePollDialogComponent<ViewMotionPoll, MotionPollService>>,
        private formBuilder: FormBuilder,
        @Inject(MAT_DIALOG_DATA) public pollData: Partial<ViewMotionPoll>
    ) {
        super(title, translate, matSnackbar, dialogRef);
    }

    public ngOnInit(): void {
        this.createDialog();
    }

    private updateDialogVoteForm(data: Partial<ViewMotionPoll>): void {
        const update: any = {
            Y: data.options[0].yes,
            N: data.options[0].no,
            A: data.options[0].abstain,
            votesvalid: data.votesvalid,
            votesinvalid: data.votesinvalid,
            votescast: data.votescast
        };

        if (this.dialogVoteForm) {
            const result = this.undoReplaceEmptyValues(update);
            this.dialogVoteForm.setValue(result);
        }
    }

    /**
     * Initialize the dialog-form depending on the poll-method.
     */
    private createDialog(): void {
        this.dialogVoteForm = this.formBuilder.group({
            Y: ['', [Validators.min(LOWEST_VOTE_VALUE)]],
            N: ['', [Validators.min(LOWEST_VOTE_VALUE)]],
            A: ['', [Validators.min(LOWEST_VOTE_VALUE)]],
            votesvalid: ['', [Validators.min(LOWEST_VOTE_VALUE)]],
            votesinvalid: ['', [Validators.min(LOWEST_VOTE_VALUE)]],
            votescast: ['', [Validators.min(LOWEST_VOTE_VALUE)]]
        });

        if (this.pollData && this.pollData.poll) {
            this.updateDialogVoteForm(this.pollData);
        }
    }
}
