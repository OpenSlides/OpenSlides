import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { ViewMotionPoll } from 'app/site/motions/models/view-motion-poll';
import { BasePollDialogComponent } from 'app/site/polls/components/base-poll-dialog.component';
import { PollFormComponent } from 'app/site/polls/components/poll-form/poll-form.component';
import { PercentBaseVerbose } from 'app/site/polls/models/view-base-poll';

@Component({
    selector: 'os-motion-poll-dialog',
    templateUrl: './motion-poll-dialog.component.html',
    styleUrls: ['./motion-poll-dialog.component.scss']
})
export class MotionPollDialogComponent extends BasePollDialogComponent<ViewMotionPoll> implements OnInit {
    public PercentBaseVerbose = PercentBaseVerbose;

    @ViewChild('pollForm', { static: false })
    protected pollForm: PollFormComponent<ViewMotionPoll>;

    public constructor(
        private fb: FormBuilder,
        title: Title,
        protected translate: TranslateService,
        matSnackbar: MatSnackBar,
        public dialogRef: MatDialogRef<BasePollDialogComponent<ViewMotionPoll>>,
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
     * Pre-executed method to initialize the dialog-form depending on the poll-method.
     */
    private createDialog(): void {
        this.dialogVoteForm = this.fb.group({
            Y: [0, [Validators.min(-2)]],
            N: [0, [Validators.min(-2)]],
            A: [0, [Validators.min(-2)]],
            votesvalid: [0, [Validators.min(-2)]],
            votesinvalid: [0, [Validators.min(-2)]],
            votescast: [0, [Validators.min(-2)]]
        });

        if (this.pollData.poll) {
            this.updateDialogVoteForm(this.pollData);
        }
    }
}
