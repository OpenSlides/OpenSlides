import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { OperatorService } from 'app/core/core-services/operator.service';
import { MotionPollRepositoryService } from 'app/core/repositories/motions/motion-poll-repository.service';
import { MotionVoteRepositoryService } from 'app/core/repositories/motions/motion-vote-repository.service';
import { VotingService } from 'app/core/ui-services/voting.service';
import { MotionPollMethods } from 'app/shared/models/motions/motion-poll';
import { ViewMotionPoll } from 'app/site/motions/models/view-motion-poll';
import { ViewMotionVote } from 'app/site/motions/models/view-motion-vote';
import { BasePollVoteComponent } from 'app/site/polls/components/base-poll-vote.component';

@Component({
    selector: 'os-motion-poll-vote',
    templateUrl: './motion-poll-vote.component.html',
    styleUrls: ['./motion-poll-vote.component.scss']
})
export class MotionPollVoteComponent extends BasePollVoteComponent<ViewMotionPoll> implements OnInit {
    // holds the currently selected vote
    public selectedVote: 'Y' | 'N' | 'A' = null;
    // holds the last saved vote
    public currentVote: ViewMotionVote;

    public pollMethods = MotionPollMethods;

    private votes: ViewMotionVote[];

    public constructor(
        title: Title,
        translate: TranslateService,
        matSnackbar: MatSnackBar,
        vmanager: VotingService,
        operator: OperatorService,
        private voteRepo: MotionVoteRepositoryService,
        private pollRepo: MotionPollRepositoryService
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
            if (filtered.length) {
                if (filtered.length > 1) {
                    // output warning and continue to keep the error case user friendly
                    console.error('A user should never have more than one vote on the same poll.');
                }
                this.currentVote = filtered[0];
                this.selectedVote = filtered[0].value;
            }
        }
    }

    public saveVote(): void {
        if (this.selectedVote) {
            this.pollRepo.vote(this.selectedVote, this.poll.id).catch(this.raiseError);
        }
    }
}
