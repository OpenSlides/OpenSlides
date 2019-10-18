import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { CalculablePollKey, PollVoteValue } from 'app/core/ui-services/poll.service';
import { ViewAssignmentOption } from '../../models/view-assignment-option';
import { ViewAssignmentPoll } from '../../models/view-assignment-poll';

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
        @Inject(MAT_DIALOG_DATA) public data: ViewAssignmentPoll
    ) {
        switch (this.data.pollmethod) {
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
        /*const error = this.data.options.find(dataoption => {
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
            this.dialogRef.close(this.data);
        }*/
    }

    /**
     * TODO: currently unused
     *
     * @param key poll option to be labeled
     * @returns a label for a poll option
     */
    public getLabel(key: CalculablePollKey): string {
        // return this.pollService.getLabel(key);
        throw new Error('TODO');
    }

    /**
     * Updates a vote value
     *
     * @param value the value to update
     * @param candidate the candidate for whom to update the value
     * @param newData the new value
     */
    public setValue(value: PollVoteValue, candidate: ViewAssignmentOption, newData: string): void {
        /*const vote = candidate.votes.find(v => v.value === value);
        if (vote) {
            vote.weight = parseFloat(newData);
        } else {
            candidate.votes.push({
                value: value,
                weight: parseFloat(newData)
            });
        }*/
    }

    /**
     * Retrieves the current value for a voting option
     *
     * @param value the vote value (e.g. 'Abstain')
     * @param candidate the pollOption
     * @returns the currently entered number or undefined if no number has been set
     */
    public getValue(value: PollVoteValue, candidate: ViewAssignmentOption): number | undefined {
        /*const val = candidate.votes.find(v => v.value === value);
        return val ? val.weight : undefined;*/
        throw new Error('TODO');
    }

    /**
     * Retrieves a per-poll value
     *
     * @param value
     * @returns integer or undefined
     */
    public getSumValue(value: any /*SummaryPollKey*/): number | undefined {
        // return this.data[value] || undefined;
        throw new Error('TODO');
    }

    /**
     * Sets a per-poll value
     *
     * @param value
     * @param weight
     */
    public setSumValue(value: any /*SummaryPollKey*/, weight: string): void {
        this.data[value] = parseFloat(weight);
    }

    public getGridClass(): string {
        return `votes-grid-${this.optionPollKeys.length}`;
    }
}
