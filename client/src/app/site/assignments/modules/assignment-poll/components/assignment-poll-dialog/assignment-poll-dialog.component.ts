import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { AssignmentPollMethod } from 'app/shared/models/assignments/assignment-poll';
import { LOWEST_VOTE_VALUE, PollType } from 'app/shared/models/poll/base-poll';
import { GeneralValueVerbose, VoteValue, VoteValueVerbose } from 'app/shared/models/poll/base-vote';
import {
    AssignmentPollMethodVerbose,
    AssignmentPollPercentBaseVerbose,
    ViewAssignmentPoll
} from 'app/site/assignments/models/view-assignment-poll';
import { BasePollDialogComponent } from 'app/site/polls/components/base-poll-dialog.component';
import { PollFormComponent } from 'app/site/polls/components/poll-form/poll-form.component';
import { PollPropertyVerbose } from 'app/site/polls/models/view-base-poll';
import { ViewUser } from 'app/site/users/models/view-user';
import { AssignmentPollService, UnknownUserLabel } from '../../services/assignment-poll.service';

type OptionsObject = { user_id: number; user: ViewUser }[];

/**
 * A dialog for updating the values of an assignment-related poll.
 */
@Component({
    selector: 'os-assignment-poll-dialog',
    templateUrl: './assignment-poll-dialog.component.html',
    styleUrls: ['./assignment-poll-dialog.component.scss']
})
export class AssignmentPollDialogComponent
    extends BasePollDialogComponent<ViewAssignmentPoll, AssignmentPollService>
    implements OnInit {
    public unknownUserLabel = UnknownUserLabel;
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
    protected pollForm: PollFormComponent<ViewAssignmentPoll, AssignmentPollService>;

    /**
     * vote entries for each option in this component. Is empty if method
     * requires one vote per candidate
     */
    public analogPollValues: VoteValue[];

    public voteValueVerbose = VoteValueVerbose;
    public generalValueVerbose = GeneralValueVerbose;
    public PollPropertyVerbose = PollPropertyVerbose;

    public AssignmentPollMethodVerbose = AssignmentPollMethodVerbose;
    public AssignmentPollPercentBaseVerbose = AssignmentPollPercentBaseVerbose;

    public options: OptionsObject;

    public globalYesEnabled: boolean;
    public globalNoEnabled: boolean;
    public globalAbstainEnabled: boolean;

    public get isAnalogPoll(): boolean {
        return (
            this.pollForm &&
            this.pollForm.contentForm &&
            this.pollForm.contentForm.get('type').value === PollType.Analog
        );
    }

    /**
     * Constructor. Retrieves necessary metadata from the pollService,
     * injects the poll itself
     */
    public constructor(
        private fb: FormBuilder,
        title: Title,
        protected translate: TranslateService,
        matSnackbar: MatSnackBar,
        public dialogRef: MatDialogRef<BasePollDialogComponent<ViewAssignmentPoll, AssignmentPollService>>,
        public assignmentPollService: AssignmentPollService,
        @Inject(MAT_DIALOG_DATA) public pollData: Partial<ViewAssignmentPoll>
    ) {
        super(title, translate, matSnackbar, dialogRef);
    }

    public ngOnInit(): void {
        // TODO: not solid.
        // on new poll creation, poll.options does not exist, so we have to build a substitute
        // from the assignment candidates
        if (this.pollData) {
            if (this.pollData.options) {
                this.options = this.pollData.options;
            } else if (
                this.pollData.assignment &&
                this.pollData.assignment.candidates &&
                this.pollData.assignment.candidates.length
            ) {
                this.options = this.pollData.assignment.candidates.map(
                    user => ({
                        user_id: user.id,
                        user: user
                    }),
                    {}
                );
            }
        }

        this.subscriptions.push(
            this.pollForm.contentForm.valueChanges.pipe(debounceTime(150), distinctUntilChanged()).subscribe(() => {
                this.createDialog();
            })
        );
    }

    private setAnalogPollValues(): void {
        const pollmethod = this.pollForm.contentForm.get('pollmethod').value;
        this.globalYesEnabled = this.pollForm.contentForm.get('global_yes').value;
        this.globalNoEnabled = this.pollForm.contentForm.get('global_no').value;
        this.globalAbstainEnabled = this.pollForm.contentForm.get('global_abstain').value;

        const analogPollValues: VoteValue[] = [];

        if (pollmethod === AssignmentPollMethod.N) {
            analogPollValues.push('N');
        } else {
            analogPollValues.push('Y');

            if (pollmethod !== AssignmentPollMethod.Y) {
                analogPollValues.push('N');
            }
            if (pollmethod === AssignmentPollMethod.YNA) {
                analogPollValues.push('A');
            }
        }

        this.analogPollValues = analogPollValues;
    }

    private updateDialogVoteForm(data: Partial<ViewAssignmentPoll>): void {
        const update = {
            options: {},
            votesvalid: data.votesvalid,
            votesinvalid: data.votesinvalid,
            votescast: data.votescast,
            amount_global_yes: data.amount_global_yes,
            amount_global_no: data.amount_global_no,
            amount_global_abstain: data.amount_global_abstain
        };
        for (const option of data.options) {
            const votes: any = {};
            votes.Y = option.yes;
            if (data.pollmethod !== AssignmentPollMethod.Y) {
                votes.N = option.no;
            }
            if (data.pollmethod === AssignmentPollMethod.YNA) {
                votes.A = option.abstain;
            }
            update.options[option.user_id] = votes;
        }

        if (this.dialogVoteForm) {
            const result = this.undoReplaceEmptyValues(update);
            this.dialogVoteForm.patchValue(result);
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
                            [value]: ['', [Validators.min(LOWEST_VOTE_VALUE)]]
                        }))
                    )
                }))
            ),
            amount_global_yes: ['', [Validators.min(LOWEST_VOTE_VALUE)]],
            amount_global_no: ['', [Validators.min(LOWEST_VOTE_VALUE)]],
            amount_global_abstain: ['', [Validators.min(LOWEST_VOTE_VALUE)]],
            // insert all used global fields
            ...this.sumValues.mapToObject(sumValue => ({
                [sumValue]: ['', [Validators.min(LOWEST_VOTE_VALUE)]]
            }))
        });
        if (this.isAnalogPoll && this.pollData.poll) {
            this.updateDialogVoteForm(this.pollData);
        }
    }
}
