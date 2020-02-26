import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { AssignmentPollMethod } from 'app/shared/models/assignments/assignment-poll';
import { GeneralValueVerbose, VoteValue, VoteValueVerbose } from 'app/shared/models/poll/base-vote';
import {
    AssignmentPollMethodVerbose,
    AssignmentPollPercentBaseVerbose
} from 'app/site/assignments/models/view-assignment-poll';
import { BasePollDialogComponent } from 'app/site/polls/components/base-poll-dialog.component';
import { PollFormComponent } from 'app/site/polls/components/poll-form/poll-form.component';
import { ViewUser } from 'app/site/users/models/view-user';
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
export class AssignmentPollDialogComponent extends BasePollDialogComponent<ViewAssignmentPoll> implements OnInit {
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
    protected pollForm: PollFormComponent<ViewAssignmentPoll>;

    /**
     * vote entries for each option in this component. Is empty if method
     * requires one vote per candidate
     */
    public analogPollValues: VoteValue[];

    public voteValueVerbose = VoteValueVerbose;
    public generalValueVerbose = GeneralValueVerbose;

    public AssignmentPollMethodVerbose = AssignmentPollMethodVerbose;
    public AssignmentPollPercentBaseVerbose = AssignmentPollPercentBaseVerbose;

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
        public dialogRef: MatDialogRef<BasePollDialogComponent<ViewAssignmentPoll>>,
        @Inject(MAT_DIALOG_DATA) public pollData: Partial<ViewAssignmentPoll>
    ) {
        super(title, translate, matSnackbar, dialogRef);
    }

    public ngOnInit(): void {
        // TODO: not solid.
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
        if (pollmethod !== AssignmentPollMethod.Votes) {
            this.analogPollValues.push('N');
        }
        if (pollmethod === AssignmentPollMethod.YNA) {
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
            if (data.pollmethod !== AssignmentPollMethod.Votes) {
                votes.N = option.no;
            }
            if (data.pollmethod === AssignmentPollMethod.YNA) {
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
     * Sets a per-poll value
     *
     * @param value
     * @param weight
     */
    public setSumValue(value: any /*SummaryPollKey*/, weight: string): void {
        this.pollData[value] = parseFloat(weight);
    }
}
