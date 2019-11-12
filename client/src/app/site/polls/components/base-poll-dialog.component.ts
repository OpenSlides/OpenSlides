import { FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { MatDialogRef } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { OneOfValidator } from 'app/shared/validators/one-of-validator';
import { BaseViewComponent } from 'app/site/base/base-view';
import { PollFormComponent } from './poll-form/poll-form.component';

/**
 * A dialog for updating the values of a poll.
 */
export abstract class BasePollDialogComponent extends BaseViewComponent {
    public publishImmediately: boolean;

    protected pollForm: PollFormComponent;

    public dialogVoteForm: FormGroup;

    public constructor(
        title: Title,
        protected translate: TranslateService,
        matSnackbar: MatSnackBar,
        public dialogRef: MatDialogRef<BasePollDialogComponent>
    ) {
        super(title, translate, matSnackbar);
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
     * check recursively whether the given vote data object is empty, meaning all values would be '-2' when sent
     * @param voteData the (partial) vote data
     */
    private isVoteDataEmpty(voteData: object): boolean {
        return Object.values(voteData).every(
            value => !value || (typeof value === 'object' && this.isVoteDataEmpty(value))
        );
    }

    /**
     * iterates over the given data and returns a new object with all empty fields recursively
     * replaced with '-2'
     * @param voteData the (partial) data
     */
    private replaceEmptyValues(voteData: object, undo: boolean = false): object {
        const result = {};
        for (const key of Object.keys(voteData)) {
            if (typeof voteData[key] === 'object' && voteData[key]) {
                result[key] = this.replaceEmptyValues(voteData[key], undo);
            } else {
                if (undo) {
                    result[key] = voteData[key] === -2 ? null : voteData[key];
                } else {
                    result[key] = !!voteData[key] ? voteData[key] : -2;
                }
            }
        }
        return result;
    }

    /**
     * reverses the replacement of empty values by '-2'; replaces each '-2' with null
     * @param voteData the vote data
     */
    protected undoReplaceEmptyValues(voteData: object): object {
        return this.replaceEmptyValues(voteData, true);
    }
}
