import { Component, Inject, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { ViewMotionPoll } from 'app/site/motions/models/view-motion-poll';
import { MotionPollMethodsVerbose } from 'app/site/motions/models/view-motion-poll';
import { BasePollDialogComponent } from 'app/site/polls/components/base-poll-dialog.component';
import { PollFormComponent } from 'app/site/polls/components/poll-form/poll-form.component';

@Component({
    selector: 'os-motion-poll-dialog',
    templateUrl: './motion-poll-dialog.component.html',
    styleUrls: ['./motion-poll-dialog.component.scss']
})
export class MotionPollDialogComponent extends BasePollDialogComponent {
    public motionPollMethods = { YNA: MotionPollMethodsVerbose.YNA };

    @ViewChild('pollForm', { static: false })
    protected pollForm: PollFormComponent;

    public constructor(
        private fb: FormBuilder,
        title: Title,
        protected translate: TranslateService,
        matSnackbar: MatSnackBar,
        public dialogRef: MatDialogRef<BasePollDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public pollData: Partial<ViewMotionPoll>
    ) {
        super(title, translate, matSnackbar, dialogRef);
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
        // if (data.pollmethod === 'YNA') {
        //     update.A = data.options[0].abstain;
        // }

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
            Y: ['', [Validators.min(-2)]],
            N: ['', [Validators.min(-2)]],
            A: ['', [Validators.min(-2)]],
            votesvalid: ['', [Validators.min(-2)]],
            votesinvalid: ['', [Validators.min(-2)]],
            votescast: ['', [Validators.min(-2)]]
        });
        // if (this.pollData.pollmethod === MotionPollMethods.YNA) {
        //     this.dialogVoteForm.addControl('A', this.fb.control('', [Validators.min(-2)]));
        // }
        if (this.pollData.poll) {
            this.updateDialogVoteForm(this.pollData);
        }
    }
}
