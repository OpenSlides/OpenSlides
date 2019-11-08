import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TranslateService } from '@ngx-translate/core';

import { UserRepositoryService } from 'app/core/repositories/users/user-repository.service';
import { CalculablePollKey, PollVoteValue } from 'app/core/ui-services/poll.service';
import { AssignmentPoll } from 'app/shared/models/assignments/assignment-poll';
import { AssignmentPollOption } from 'app/shared/models/assignments/assignment-poll-option';
import { AssignmentPollService, SummaryPollKey } from '../../services/assignment-poll.service';
import { ViewAssignmentPoll } from '../../models/view-assignment-poll';
import { ViewAssignmentPollOption } from '../../models/view-assignment-poll-option';

/**
 * Vote entries included once for summary (e.g. total votes cast)
 */
type summaryPollKey = 'votescast' | 'votesvalid' | 'votesinvalid' | 'votesno' | 'votesabstain';

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
     * The actual poll data to work on
     */
    public poll: AssignmentPoll;

    /**
     * The summary values that will have fields in the dialog
     */
    public get sumValues(): summaryPollKey[] {
        const generalValues: summaryPollKey[] = ['votesvalid', 'votesinvalid', 'votescast'];
        if (this.data.pollmethod === 'votes') {
            return ['votesno', 'votesabstain', ...generalValues];
        } else {
            return generalValues;
        }
    }

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
     * Constructor. Retrieves necessary metadata from the pollService,
     * injects the poll itself
     */
    public constructor(
        public dialogRef: MatDialogRef<AssignmentPollDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ViewAssignmentPoll,
        private matSnackBar: MatSnackBar,
        private translate: TranslateService,
        public pollService: AssignmentPollService,
        private userRepo: UserRepositoryService
    ) {
        this.specialValues = this.pollService.specialPollVotes;
        this.poll = this.data.poll;

        switch (this.poll.pollmethod) {
            case 'votes':
                this.optionPollKeys = ['Votes'];
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
     * submits and closes the dialog if successful, else displays an error popup.
     * TODO better validation
     */
    public submit(): void {
        const error = this.data.options.find(dataoption => {
            this.optionPollKeys.some(key => {
                const keyValue = dataoption.votes.find(o => o.value === key);
                return !keyValue || keyValue.weight === undefined;
            });
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
            this.dialogRef.close(this.poll);
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
     * Updates a vote value
     *
     * @param value the value to update
     * @param candidate the candidate for whom to update the value
     * @param newData the new value
     */
    public setValue(value: PollVoteValue, candidate: ViewAssignmentPollOption, newData: string): void {
        const vote = candidate.votes.find(v => v.value === value);
        if (vote) {
            vote.weight = parseFloat(newData);
        } else {
            candidate.votes.push({
                value: value,
                weight: parseFloat(newData)
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
    public getValue(value: PollVoteValue, candidate: AssignmentPollOption): number | undefined {
        const val = candidate.votes.find(v => v.value === value);
        return val ? val.weight : undefined;
    }

    /**
     * Retrieves a per-poll value
     *
     * @param value
     * @returns integer or undefined
     */
    public getSumValue(value: SummaryPollKey): number | undefined {
        return this.data[value] || undefined;
    }

    /**
     * Sets a per-poll value
     *
     * @param value
     * @param weight
     */
    public setSumValue(value: SummaryPollKey, weight: string): void {
        this.poll[value] = parseFloat(weight);
    }

    public getGridClass(): string {
        return `votes-grid-${this.optionPollKeys.length}`;
    }

    /**
     * Fetches the name for a poll option
     * TODO: observable. Note that the assignment.related_user may not contain the user (anymore?)
     *
     * @param option Any poll option
     * @returns the full_name for the candidate
     */
    public getCandidateName(option: AssignmentPollOption): string {
        const user = this.userRepo.getViewModel(option.candidate_id);
        return user ? user.full_name : '';
    }
}
