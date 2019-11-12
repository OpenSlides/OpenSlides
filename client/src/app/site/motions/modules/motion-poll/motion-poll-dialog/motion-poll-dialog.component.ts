import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { GroupRepositoryService } from 'app/core/repositories/users/group-repository.service';
import { MotionPoll, MotionPollMethods } from 'app/shared/models/motions/motion-poll';
import { OneOfValidator } from 'app/shared/validators/one-of-validator';
import { BaseViewComponent } from 'app/site/base/base-view';
import { ViewMotionPoll } from 'app/site/motions/models/view-motion-poll';
import { MotionPollService } from 'app/site/motions/services/motion-poll.service';
import { ViewGroup } from 'app/site/users/models/view-group';

/**
 * A dialog for updating the values of a poll.
 */
@Component({
    selector: 'os-motion-poll-dialog',
    templateUrl: './motion-poll-dialog.component.html',
    styleUrls: ['./motion-poll-dialog.component.scss']
})
export class MotionPollDialogComponent extends BaseViewComponent implements OnInit {
    /**
     * The form-group for the meta-info.
     */
    public contentForm: FormGroup;

    /**
     * The form-group for the votes.
     */
    public dialogVoteForm: FormGroup;

    /**
     * The different methods for this poll.
     */
    public pollMethods = this.pollService.getMotionPollMethodsVerbose();

    /**
     * The different types the poll can accept.
     */
    public pollTypes = this.pollService.getPollTypeVerbose();

    /**
     * The percent base for the poll.
     */
    public percentBases: object = this.pollService.getPercentBaseVerbose();

    /**
     * The majority methods for the poll.
     */
    public majorityMethods = this.pollService.getMajorityMethodVerbose();

    /**
     * Reference to the observable of the groups. Used by the `search-value-component`.
     */
    public groupObservable: Observable<ViewGroup[]> = null;

    /**
     * An twodimensional array to handle constant values for this poll.
     */
    public pollValues: [string, unknown][] = [];

    /**
     * Model for the checkbox.
     * If true, the given poll will immediately be published.
     */
    public publishImmediately = true;

    /**
     * Constructor. Retrieves necessary metadata from the pollService,
     * injects the poll itself
     */
    public constructor(
        title: Title,
        protected translate: TranslateService,
        matSnackbar: MatSnackBar,
        public dialogRef: MatDialogRef<MotionPollDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ViewMotionPoll,
        public pollService: MotionPollService,
        private fb: FormBuilder,
        private groupRepo: GroupRepositoryService
    ) {
        super(title, translate, matSnackbar);
        this.createPoll();
        this.createDialog();
    }

    /**
     * OnInit.
     * Sets the observable for groups.
     */
    public ngOnInit(): void {
        this.groupObservable = this.groupRepo.getViewModelListObservable();
    }

    /**
     * Close the dialog, submitting nothing. Triggered by the cancel button and
     * default angular cancelling behavior
     */
    public cancel(): void {
        this.dialogRef.close();
    }

    /**
     * Submits the values from dialog.
     */
    public submitPoll(): void {
        const notEmpty = !Object.values(this.dialogVoteForm.value).every(value => !value);
        const answer = {
            poll: this.createEmptyPoll(),
            data: notEmpty ? this.getDialogFormValue() : null,
            publish: this.publishImmediately
        };
        this.dialogRef.close(answer);
    }

    /**
     * Function to save changes for this poll.
     */
    public createEmptyPoll(): ViewMotionPoll {
        const pollValues = this.contentForm.value;
        const poll: ViewMotionPoll = this.data;
        Object.keys(pollValues).forEach(key => (poll[key] = pollValues[key]));
        return poll;
    }

    /**
     * Handles the state-change of the checkbox `Publish immediately`.
     *
     * If it is checked, at least one of the fields have to be filled.
     *
     * @param checked The next state.
     */
    public publishStateChanged(checked: boolean): void {
        this.publishImmediately = checked;
        if (checked) {
            this.dialogVoteForm.setValidators(OneOfValidator.validation(...Object.keys(this.dialogVoteForm.controls)));
        } else {
            this.dialogVoteForm.setValidators(null);
        }
    }

    /**
     * Function to create a new poll and send data to the server.
     */
    private createPoll(): void {
        this.contentForm = this.fb.group({
            title: ['', Validators.required],
            type: ['', Validators.required],
            pollmethod: ['', Validators.required],
            onehundred_percent_base: ['', Validators.required],
            majority_method: ['', Validators.required],
            groups_id: [[]]
        });
        if (this.data) {
            this.updateForm(this.data);
        }
        this.updatePollValues(this.contentForm.value);

        this.subscriptions.push(
            this.contentForm.valueChanges.subscribe(values => {
                this.checkFormValues();
                this.updatePollValues(values);
            })
        );
    }

    /**
     * Pre-executed method to initialize the dialog-form depending on the poll-method.
     */
    private createDialog(): void {
        this.dialogVoteForm = this.fb.group({
            Y: ['', [Validators.min(-2)]],
            N: ['', [Validators.min(-2)]],
            votesvalid: ['', [Validators.min(-2)]],
            votesinvalid: ['', [Validators.min(-2)]],
            votescast: ['', [Validators.min(-2)]]
        });
        if (this.data.pollmethod === MotionPollMethods.YNA) {
            this.dialogVoteForm.addControl('A', this.fb.control('', [Validators.min(-2)]));
        }
        if (this.data.poll) {
            this.updateDialogVoteForm(this.data.poll);
        }
    }

    /**
     * This updates the poll-form, if it's changed.
     */
    private updateForm(data: { [key: string]: any }): void {
        if (this.contentForm) {
            Object.keys(this.contentForm.controls).forEach(key => this.contentForm.get(key).setValue(data[key]));
        }
    }

    private updateDialogVoteForm(data: MotionPoll): void {
        const update = {
            Y: data.options[0].yes,
            N: data.options[0].no,
            A: null,
            votesvalid: data.votesvalid,
            votesinvalid: data.votesinvalid,
            votescast: data.votescast
        };
        if (data.pollmethod === 'YNA') {
            update.A = data.options[0].abstain;
        }
        if (this.dialogVoteForm) {
            Object.keys(this.dialogVoteForm.controls).forEach(key => {
                if (update[key] === -2 || !update[key]) {
                    return;
                }
                this.dialogVoteForm.get(key).setValue(update[key]);
            });
        }
    }

    /**
     * This updates the poll-values to get correct data in the view.
     *
     * @param data Passing the properties of the poll.
     */
    private updatePollValues(data: { [key: string]: any }): void {
        this.pollValues = Object.entries(data)
            .filter(([key, _]) => key === 'type' || key === 'pollmethod')
            .map(([key, value]) => [
                this.pollService.getVerboseNameForKey(key),
                this.pollService.getVerboseNameForValue(key, value as string)
            ]);
        if (data.type === 'named') {
            this.pollValues.push([
                this.pollService.getVerboseNameForKey('groups'),
                this.groupRepo.getNameForIds(...data.groups_id)
            ]);
        }
    }

    /**
     * Checkes, if the values of the form are correct.
     */
    private checkFormValues(): void {
        if (
            this.contentForm.get('pollmethod').value === 'YN' &&
            this.contentForm.get('onehundred_percent_base').value === 'YNA'
        ) {
            this.contentForm.get('onehundred_percent_base').setValue('');
        }
        if (this.contentForm.get('pollmethod').value === 'YN') {
            this.percentBases = {};
            for (const [key, value] of Object.entries(this.pollService.getPercentBaseVerbose())) {
                if (key !== 'YNA') {
                    this.percentBases[key] = value;
                }
            }
        } else {
            this.percentBases = this.pollService.getPercentBaseVerbose();
        }
    }

    /**
     * This builds an object, where all `undefined` fields will be interpreted as `-2`.
     *
     * @returns The object ready to send.
     */
    private getDialogFormValue(): object {
        const result = {};
        for (const key of Object.keys(this.dialogVoteForm.value)) {
            result[key] = !!this.dialogVoteForm.value[key] ? this.dialogVoteForm.value[key] : -2;
        }
        return result;
    }
}
