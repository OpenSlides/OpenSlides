import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

import { AssignmentPollService } from '../../services/assignment-poll.service';
import { CalculablePollKey, PollVoteValue } from 'app/core/ui-services/poll.service';
import { Poll } from 'app/shared/models/assignments/poll';
import { PollOption } from 'app/shared/models/assignments/poll-option';
import { ViewUser } from 'app/site/users/models/view-user';

/**
 * A dialog for updating the values of an assignment-related poll.
 */
@Component({
    selector: 'os-assignment-poll-dialog',
    templateUrl: './assignment-poll-dialog.component.html',
    styleUrls: ['./assignment-poll-dialog.component.scss']
})
export class AssignmentPollDialogComponent {
    /**
     * List of accepted special non-numerical values.
     * See {@link PollService.specialPollVotes}
     */
    public specialValues: [number, string][];

    /**
     * vote entries for each option in this component. Is empty if method
     * requires one vote per candidate
     */
    public optionPollKeys: PollVoteValue[];

    /**
     * Vote entries included once for summary (e.g. total votes cast)
     */
    public summaryPollKeys: CalculablePollKey[];

    /**
     * Constructor. Retrieves necessary metadata from the pollService,
     * injects the poll itself
     */
    public constructor(
        public dialogRef: MatDialogRef<AssignmentPollDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { poll: Poll; users: ViewUser[] },
        private matSnackBar: MatSnackBar,
        private translate: TranslateService,
        private pollService: AssignmentPollService
    ) {
        this.specialValues = this.pollService.specialPollVotes;
        switch (this.data.poll.pollmethod) {
            case 'votes':
                this.optionPollKeys = ['Yes'];
                break;
            case 'yn':
                this.optionPollKeys = ['Yes', 'No'];
                break;
            case 'yna':
                this.optionPollKeys = ['Yes', 'No', 'Abstain'];
                break;
        }
    }

    /**
     * Close the dialog, submitting nothing. Triggered by the cancel button and
     * default angular cancelling behavior
     */
    public cancel(): void {
        this.dialogRef.close();
    }

    /**
     * Validates candidates input (every candidate has their options filled in),
     * submits and closes the dialog if successfull, else displays an error popup.
     * TODO better validation
     */
    public submit(): void {
        const error = this.data.poll.options.find(dataoption => {
            for (const key of this.optionPollKeys) {
                const keyValue = dataoption.votes.find(o => o.value === key);
                if (!keyValue || keyValue.weight === undefined) {
                    return true;
                }
            }
        });
        if (error) {
            this.matSnackBar.open(
                this.translate.instant('Please fill in the values for each candidate'),
                this.translate.instant('OK'),
                {
                    duration: 1000
                }
            );
        } else {
            this.dialogRef.close(this.data.poll);
        }
    }

    /**
     * TODO: currently unused
     *
     * @param key poll option to be labeled
     * @returns a label for a poll option
     */
    public getLabel(key: CalculablePollKey): string {
        return this.pollService.getLabel(key);
    }

    /**
     * Get the (full) name of a pollOption candidate
     *
     * @param the id of the candidate
     * @returns the full_name property
     */
    public getName(candidateId: number): string {
        const user = this.data.users.find(c => c.id === candidateId);
        return user ? user.full_name : 'unknown user';
        // TODO error handling
    }

    /**
     * Updates a vote value
     *
     * @param value the value to update
     * @param candidate the candidate for whom to update the value
     * @param newData the new value
     */
    public setValue(value: PollVoteValue, candidate: PollOption, newData: number): void {
        const vote = candidate.votes.find(v => v.value === value);
        if (vote) {
            vote.weight = +newData;
        } else {
            candidate.votes.push({
                value: value,
                weight: +newData
            });
        }
    }

    /**
     * Retrieves the current value for a voting option
     *
     * @param value the vote value (e.g. 'Abstain')
     * @param candidate the pollOption
     * @returns the currently entered number or undefined if no number has been set
     */
    public getValue(value: PollVoteValue, candidate: PollOption): number {
        const val = candidate.votes.find(v => v.value === value);
        return val ? val.weight : undefined;
    }
}
