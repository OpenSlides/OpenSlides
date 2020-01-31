import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { OperatorService } from 'app/core/core-services/operator.service';
import { AssignmentPollRepositoryService } from 'app/core/repositories/assignments/assignment-poll-repository.service';
import { AssignmentVoteRepositoryService } from 'app/core/repositories/assignments/assignment-vote-repository.service';
import { VotingService } from 'app/core/ui-services/voting.service';
import { AssignmentPollMethods } from 'app/shared/models/assignments/assignment-poll';
import { PollType } from 'app/shared/models/poll/base-poll';
import { BasePollVoteComponent } from 'app/site/polls/components/base-poll-vote.component';
import { ViewAssignmentPoll } from '../../models/view-assignment-poll';
import { ViewAssignmentVote } from '../../models/view-assignment-vote';

@Component({
    selector: 'os-assignment-poll-vote',
    templateUrl: './assignment-poll-vote.component.html',
    styleUrls: ['./assignment-poll-vote.component.scss']
})
export class AssignmentPollVoteComponent extends BasePollVoteComponent<ViewAssignmentPoll> implements OnInit {
    public pollMethods = AssignmentPollMethods;
    public PollType = PollType;

    public voteForm: FormGroup;

    /** holds the currently saved votes */
    public currentVotes: { [key: number]: string | null; global?: string } = {};

    private votes: ViewAssignmentVote[];

    public constructor(
        title: Title,
        translate: TranslateService,
        matSnackbar: MatSnackBar,
        vmanager: VotingService,
        operator: OperatorService,
        private voteRepo: AssignmentVoteRepositoryService,
        private pollRepo: AssignmentPollRepositoryService,
        private formBuilder: FormBuilder
    ) {
        super(title, translate, matSnackbar, vmanager, operator);
    }

    public ngOnInit(): void {
        this.subscriptions.push(
            this.voteRepo.getViewModelListObservable().subscribe(votes => {
                this.votes = votes;
                this.updateVotes();
            })
        );
    }

    protected updateVotes(): void {
        if (this.user && this.votes && this.poll) {
            const filtered = this.votes.filter(
                vote => vote.option.poll_id === this.poll.id && vote.user_id === this.user.id
            );
            this.voteForm = this.formBuilder.group({
                votes: this.formBuilder.group(
                    this.poll.options.mapToObject(option => ({ [option.id]: ['', [Validators.required]] }))
                )
            });
            if (
                this.poll.pollmethod === AssignmentPollMethods.Votes &&
                (this.poll.global_no || this.poll.global_abstain)
            ) {
                this.voteForm.addControl('global', new FormControl('', Validators.required));
            }

            for (const option of this.poll.options) {
                let curr_vote = filtered.find(vote => vote.option.id === option.id);
                if (this.poll.pollmethod === AssignmentPollMethods.Votes && curr_vote) {
                    if (curr_vote.value !== 'Y') {
                        this.currentVotes.global = curr_vote.valueVerbose;
                        this.voteForm.controls.global.setValue(curr_vote.value);
                        curr_vote = null;
                    } else {
                        this.currentVotes.global = null;
                    }
                }
                this.currentVotes[option.user_id] = curr_vote && curr_vote.valueVerbose;
                this.voteForm.get(['votes', option.id]).setValue(curr_vote && curr_vote.value);
            }

            if (this.poll.pollmethod === AssignmentPollMethods.Votes) {
                this.voteForm.controls.votes.valueChanges.subscribe(value => {
                    if (Object.values(value).some(vote => vote)) {
                        const ctrl = this.voteForm.controls.global;
                        if (ctrl) {
                            ctrl.reset();
                        }
                        this.saveVotesIfNamed();
                    }
                });

                this.voteForm.controls.global.valueChanges.subscribe(value => {
                    if (value) {
                        this.voteForm.controls.votes.reset();
                        this.saveVotesIfNamed();
                    }
                });
            }
        }
    }

    private saveVotesIfNamed(): void {
        if (this.poll.type === PollType.Named && !this.isSaveButtonDisabled()) {
            this.saveVotes();
        }
    }

    public saveVotes(): void {
        let values = this.voteForm.value.votes;
        // convert Y to 1 and null to 0 for votes method
        if (this.poll.pollmethod === this.pollMethods.Votes) {
            if (this.voteForm.value.global) {
                values = JSON.stringify(this.voteForm.value.global);
            } else {
                this.poll.options.forEach(option => {
                    values[option.id] = this.voteForm.value.votes[option.id] === 'Y' ? 1 : 0;
                });
            }
        }
        this.pollRepo.vote(values, this.poll.id).catch(this.raiseError);
    }

    public isSaveButtonDisabled(): boolean {
        return (
            !this.voteForm ||
            this.voteForm.pristine ||
            (this.poll.pollmethod === AssignmentPollMethods.Votes
                ? !this.getAllFormControls().some(control => control.valid)
                : this.voteForm.invalid)
        );
    }

    public getVotesCount(): number {
        return Object.values(this.voteForm.value.votes).filter(vote => vote).length;
    }

    private getAllFormControls(): AbstractControl[] {
        if (this.voteForm) {
            const votesFormGroup = this.voteForm.controls.votes as FormGroup;
            return [...Object.values(votesFormGroup.controls), this.voteForm.controls.global];
        } else {
            return [];
        }
    }

    public yesButtonClicked($event: MouseEvent, optionId: string): void {
        if (this.poll.pollmethod === AssignmentPollMethods.Votes) {
            // check current value (before click)
            if (this.voteForm.value.votes[optionId] === 'Y') {
                // this handler is executed before the mat-radio-button handler, so we have to set a timeout or else the other handler will just set the value again
                setTimeout(() => {
                    this.voteForm.get(['votes', optionId]).setValue(null);
                    this.voteForm.markAsDirty();
                    this.saveVotesIfNamed();
                });
            } else {
                // check if by clicking this button, the amount of votes would succeed the permitted amount
                if (this.getVotesCount() >= this.poll.votes_amount) {
                    $event.preventDefault();
                }
            }
        }
    }
}
