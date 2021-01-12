import { FormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { VOTE_UNDOCUMENTED } from 'app/shared/models/poll/base-poll';
import { OneOfValidator } from 'app/shared/validators/one-of-validator';
import { BaseViewComponentDirective } from 'app/site/base/base-view';
import { PollFormComponent } from './poll-form/poll-form.component';
import { PollService } from '../services/poll.service';
import { ViewBasePoll } from '../models/view-base-poll';

/**
 * A dialog for updating the values of a poll.
 */
export abstract class BasePollDialogComponent<
    T extends ViewBasePoll,
    S extends PollService
> extends BaseViewComponentDirective {
    public publishImmediately: boolean;

    protected pollForm: PollFormComponent<T, S>;

    public dialogVoteForm: FormGroup;

    public constructor(
        title: Title,
        protected translate: TranslateService,
        matSnackbar: MatSnackBar,
        public dialogRef: MatDialogRef<BasePollDialogComponent<T, S>>
    ) {
        super(title, translate, matSnackbar);
        this.addKeyListener();
    }

    private addKeyListener(): void {
        if (this.dialogRef) {
            this.dialogRef.keydownEvents().subscribe((event: KeyboardEvent) => {
                if (event.key === 'Enter' && event.shiftKey) {
                    this.submitPoll();
                }

                if (event.key === 'Escape') {
                    this.dialogRef.close();
                }
            });
        }
    }

    /**
     * Submits the values from dialog.
     */
    public submitPoll(): void {
        const answer = {
            ...this.pollForm.getValues(),
            votes: this.getVoteData(),
            publish_immediately: this.publishImmediately
        };
        console.log('answer: ', answer);

        this.dialogRef.close(answer);
    }

    /**
     * Handles the state-change of the checkbox `Publish immediately`.
     *
     * If it is checked, at least one of the fields have to be filled.
     *
     * @param checked The next state.
     */
    public publishStateChanged(checked: boolean): void {
        if (checked) {
            this.dialogVoteForm.setValidators(OneOfValidator.validation(...Object.keys(this.dialogVoteForm.controls)));
        } else {
            this.dialogVoteForm.setValidators(null);
        }
    }

    public getVoteData(): object {
        if (this.isVoteDataEmpty(this.dialogVoteForm.value)) {
            return undefined;
        }
        return this.replaceEmptyValues(this.dialogVoteForm.value);
    }

    /**
     * check recursively whether the given vote data object is empty, meaning all values would
     * be VOTE_UNDOCUMENTED when sent
     *
     * @param voteData the (partial) vote data
     */
    private isVoteDataEmpty(voteData: object): boolean {
        return Object.values(voteData).every(
            value => !value || (typeof value === 'object' && this.isVoteDataEmpty(value))
        );
    }

    /**
     * iterates over the given data and returns a new object with all empty fields recursively
     * replaced with VOTE_UNDOCUMENTED
     * @param voteData the (partial) data
     */
    private replaceEmptyValues(voteData: object, undo: boolean = false): object {
        const result = {};
        for (const key of Object.keys(voteData)) {
            if (typeof voteData[key] === 'object' && voteData[key]) {
                result[key] = this.replaceEmptyValues(voteData[key], undo);
            } else {
                if (undo) {
                    result[key] = voteData[key] === VOTE_UNDOCUMENTED ? null : voteData[key];
                } else {
                    result[key] = !!voteData[key] ? voteData[key] : VOTE_UNDOCUMENTED;
                }
            }
        }
        return result;
    }

    /**
     * reverses the replacement of empty values by VOTE_UNDOCUMENTED; replaces each
     * VOTE_UNDOCUMENTED with null
     *
     * @param voteData the vote data
     */
    protected undoReplaceEmptyValues(voteData: object): object {
        return this.replaceEmptyValues(voteData, true);
    }
}
