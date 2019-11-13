import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { AssignmentPollMethods } from 'app/shared/models/assignments/assignment-poll';
import { GeneralValueVerbose, VoteValue, VoteValueVerbose } from 'app/shared/models/poll/base-vote';
import { AssignmentPollMethodsVerbose } from 'app/site/assignments/models/view-assignment-poll';
import { BasePollDialogComponent } from 'app/site/polls/components/base-poll-dialog.component';
import { PollFormComponent } from 'app/site/polls/components/poll-form/poll-form.component';
import { CalculablePollKey, PollVoteValue } from 'app/site/polls/services/poll.service';
import { ViewUser } from 'app/site/users/models/view-user';
import { ViewAssignmentOption } from '../../models/view-assignment-option';
import { ViewAssignmentPoll } from '../../models/view-assignment-poll';

type OptionsObject = { user_id: number; user: ViewUser }[];

/**
 * A dialog for updating the values of an assignment-related poll.
 */
@Component({
    selector: 'os-assignment-poll-dialog',
    templateUrl: './assignment-poll-dialog.component.html',
    styleUrls: ['./assignment-poll-dialog.component.scss']
})
export class AssignmentPollDialogComponent extends BasePollDialogComponent implements OnInit {
    /**
     * The actual poll data to work on
     */
    public poll: AssignmentPoll;

    /**
     * The summary values that will have fields in the dialog
     */
    public get sumValues(): string[] {
        return ['votesvalid', 'votesinvalid', 'votescast'];
    }

    /**
     * List of accepted special non-numerical values.
     * See {@link PollService.specialPollVotes}
     */
    public specialValues: [number, string][];

    @ViewChild('pollForm', { static: true })
    protected pollForm: PollFormComponent;

    /**
     * vote entries for each option in this component. Is empty if method
     * requires one vote per candidate
     */
    public analogPollValues: VoteValue[];

    public voteValueVerbose = VoteValueVerbose;
    public generalValueVerbose = GeneralValueVerbose;

    public assignmentPollMethods = AssignmentPollMethodsVerbose;

    public options: OptionsObject;

    /**
     * Constructor. Retrieves necessary metadata from the pollService,
     * injects the poll itself
     */
    public constructor(
        private fb: FormBuilder,
        title: Title,
        protected translate: TranslateService,
        matSnackbar: MatSnackBar,
        public dialogRef: MatDialogRef<BasePollDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public pollData: Partial<ViewAssignmentPoll>
    ) {
        super(title, translate, matSnackbar, dialogRef);
    }

    public ngOnInit(): void {
        // on new poll creation, poll.options does not exist, so we have to build a substitute from the assignment candidates
        this.options = this.pollData.options
            ? this.pollData.options
            : this.pollData.assignment.candidates.map(
                  user => ({
                      user_id: user.id,
                      user: user
                  }),
                  {}
              );

        this.subscriptions.push(
            this.pollForm.contentForm.get('pollmethod').valueChanges.subscribe(() => {
                this.createDialog();
            })
        );
    }

    private setAnalogPollValues(): void {
        const pollmethod = this.pollForm.contentForm.get('pollmethod').value;
        this.analogPollValues = ['Y'];
        if (pollmethod !== AssignmentPollMethods.Votes) {
            this.analogPollValues.push('N');
        }
        if (pollmethod === AssignmentPollMethods.YNA) {
            this.analogPollValues.push('A');
        }
    }

    private updateDialogVoteForm(data: Partial<ViewAssignmentPoll>): void {
        const update = {
            options: {},
            votesvalid: data.votesvalid,
            votesinvalid: data.votesinvalid,
            votescast: data.votescast
        };
        for (const option of data.options) {
            const votes: any = {};
            votes.Y = option.yes;
            if (data.pollmethod !== AssignmentPollMethods.Votes) {
                votes.N = option.no;
            }
            if (data.pollmethod === AssignmentPollMethods.YNA) {
                votes.A = option.abstain;
            }
            update.options[option.user_id] = votes;
        }

        if (this.dialogVoteForm) {
            const result = this.undoReplaceEmptyValues(update);
            this.dialogVoteForm.setValue(result);
        }
    }

    /**
     * Pre-executed method to initialize the dialog-form depending on the poll-method.
     */
    private createDialog(): void {
        this.setAnalogPollValues();

        this.dialogVoteForm = this.fb.group({
            options: this.fb.group(
                // create a form group for each option with the user id as key
                this.options.mapToObject(option => ({
                    [option.user_id]: this.fb.group(
                        // for each user, create a form group with a control for each valid input (Y, N, A)
                        this.analogPollValues.mapToObject(value => ({
                            [value]: ['', [Validators.min(-2)]]
                        }))
                    )
                }))
            ),
            // insert all used global fields
            ...this.sumValues.mapToObject(sumValue => ({
                [sumValue]: ['', [Validators.min(-2)]]
            }))
        });
        if (this.pollData.poll) {
            this.updateDialogVoteForm(this.pollData);
        }
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
        this.pollData[value] = parseFloat(weight);
    }
}
