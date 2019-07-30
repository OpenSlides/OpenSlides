import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TranslateService } from '@ngx-translate/core';

import { CalculablePollKey } from 'app/core/ui-services/poll.service';
import { MotionPoll } from 'app/shared/models/motions/motion-poll';
import { MotionPollService } from 'app/site/motions/services/motion-poll.service';

/**
 * A dialog for updating the values of a poll.
 */
@Component({
    selector: 'os-motion-poll-dialog',
    templateUrl: './motion-poll-dialog.component.html',
    styleUrls: ['./motion-poll-dialog.component.scss']
})
export class MotionPollDialogComponent {
    /**
     * List of accepted special non-numerical values.
     * See {@link PollService.specialPollVotes}
     */
    public specialValues: [number, string][];

    /**
     * Array of vote entries in this component
     */
    public pollKeys: CalculablePollKey[];

    /**
     * Constructor. Retrieves necessary metadata from the pollService,
     * injects the poll itself
     */
    public constructor(
        public dialogRef: MatDialogRef<MotionPollDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: MotionPoll,
        private matSnackBar: MatSnackBar,
        private translate: TranslateService,
        private pollService: MotionPollService
    ) {
        this.pollKeys = this.pollService.pollValues;
        this.specialValues = this.pollService.specialPollVotes;
    }

    /**
     * Close the dialog, submitting nothing. Triggered by the cancel button and
     * default angular cancelling behavior
     */
    public cancel(): void {
        this.dialogRef.close();
    }

    /**
     * validates if 'yes', 'no' and 'abstain' have values, submits and closes
     * the dialog if successfull, else displays an error popup.
     * TODO better validation
     */
    public submit(): void {
        if (this.data.yes === undefined || this.data.no === undefined || this.data.abstain === undefined) {
            this.matSnackBar.open(
                this.translate.instant('Please fill in all required values'),
                this.translate.instant('OK'),
                {
                    duration: 1000
                }
            );
        } else {
            this.dialogRef.close(this.data);
        }
    }

    /**
     * Returns a label for a poll option
     * @param key poll option to be labeled
     */
    public getLabel(key: CalculablePollKey): string {
        return this.pollService.getLabel(key);
    }
}
