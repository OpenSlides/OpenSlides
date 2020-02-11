import { Component, OnInit } from '@angular/core';
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

// TODO: Duplicate
interface VoteActions {
    vote: 'Y' | 'N' | 'A';
    css: string;
    icon: string;
    label: string;
}

@Component({
    selector: 'os-assignment-poll-vote',
    templateUrl: './assignment-poll-vote.component.html',
    styleUrls: ['./assignment-poll-vote.component.scss']
})
export class AssignmentPollVoteComponent extends BasePollVoteComponent<ViewAssignmentPoll> implements OnInit {
    public pollMethods = AssignmentPollMethods;
    public PollType = PollType;
    public voteActions: VoteActions[] = [];

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
        private pollRepo: AssignmentPollRepositoryService
    ) {
        super(title, translate, matSnackbar, vmanager, operator);
    }

    public ngOnInit(): void {
        this.defineVoteOptions();
        this.subscriptions.push(
            this.voteRepo.getViewModelListObservable().subscribe(votes => {
                this.votes = votes;
                this.updateVotes();
            })
        );
    }

    private defineVoteOptions(): void {
        this.voteActions.push({
            vote: 'Y',
            css: 'voted-yes',
            icon: 'thumb_up',
            label: 'Yes'
        });

        if (this.poll.pollmethod !== AssignmentPollMethods.Votes) {
            this.voteActions.push({
                vote: 'N',
                css: 'voted-no',
                icon: 'thumb_down',
                label: 'No'
            });
        }

        if (this.poll.pollmethod === AssignmentPollMethods.YNA) {
            this.voteActions.push({
                vote: 'A',
                css: 'voted-abstain',
                icon: 'trip_origin',
                label: 'Abstain'
            });
        }
    }

    protected updateVotes(): void {
        if (this.user && this.votes && this.poll) {
            const filtered = this.votes.filter(
                vote => vote.option.poll_id === this.poll.id && vote.user_id === this.user.id
            );

            for (const option of this.poll.options) {
                let curr_vote = filtered.find(vote => vote.option.id === option.id);
                if (this.poll.pollmethod === AssignmentPollMethods.Votes && curr_vote) {
                    if (curr_vote.value !== 'Y') {
                        this.currentVotes.global = curr_vote.valueVerbose;
                        curr_vote = null;
                    } else {
                        this.currentVotes.global = null;
                    }
                }
                this.currentVotes[option.id] = curr_vote && curr_vote.valueVerbose;
            }
        }
    }

    private getPollOptionIds(): number[] {
        return this.poll.options.map(option => option.id);
    }

    public saveSingleVote(optionId: number, vote: 'Y' | 'N' | 'A'): void {
        const pollOptionIds = this.getPollOptionIds();
        const requestMap = pollOptionIds.reduce((o, n) => {
            if ((n === optionId && vote === 'Y') !== (this.currentVotes[n] === 'Yes')) {
                o[n] = 1;
            } else {
                o[n] = 0;
            }

            return o;
        }, {});

        this.pollRepo.vote(JSON.stringify(requestMap), this.poll.id).catch(this.raiseError);
    }

    public saveGlobalVote(globalVote: 'N' | 'A'): void {
        this.pollRepo.vote(`"${globalVote}"`, this.poll.id).catch(this.raiseError);
    }
}
