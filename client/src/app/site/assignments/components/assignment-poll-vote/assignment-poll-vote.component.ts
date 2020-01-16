import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { OperatorService } from 'app/core/core-services/operator.service';
import { AssignmentPollRepositoryService } from 'app/core/repositories/assignments/assignment-poll-repository.service';
import { AssignmentVoteRepositoryService } from 'app/core/repositories/assignments/assignment-vote-repository.service';
import { VotingService } from 'app/core/ui-services/voting.service';
import { AssignmentPollMethods } from 'app/shared/models/assignments/assignment-poll';
import { VoteValueVerbose } from 'app/shared/models/poll/base-vote';
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

    public voteForm: FormGroup;

    /** holds the currently saved votes */
    public currentVotes: { [key: number]: string | number | null } = {};

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
            this.voteForm = this.formBuilder.group(
                this.poll.options.reduce((obj, option) => {
                    obj[option.id] = ['', [Validators.required]];
                    return obj;
                }, {})
            );
            for (const option of this.poll.options) {
                const curr_vote = filtered.find(vote => vote.option.id === option.id);
                this.currentVotes[option.user_id] = curr_vote
                    ? this.poll.pollmethod === AssignmentPollMethods.Votes
                        ? curr_vote.weight
                        : curr_vote.value
                    : null;
                this.voteForm.get(option.id.toString()).setValue(this.currentVotes[option.user_id]);
            }
        }
    }

    public saveVotes(): void {
        this.pollRepo.vote(this.voteForm.value, this.poll.id).catch(this.raiseError);
    }

    public getCurrentVoteVerbose(user_id: number): string {
        const curr_vote = this.currentVotes[user_id];
        return this.poll.pollmethod === AssignmentPollMethods.Votes ? curr_vote : VoteValueVerbose[curr_vote];
    }
}
