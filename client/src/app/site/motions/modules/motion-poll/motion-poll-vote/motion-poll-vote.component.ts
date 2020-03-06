import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { OperatorService } from 'app/core/core-services/operator.service';
import { MotionPollRepositoryService } from 'app/core/repositories/motions/motion-poll-repository.service';
import { MotionVoteRepositoryService } from 'app/core/repositories/motions/motion-vote-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { VotingService } from 'app/core/ui-services/voting.service';
import { MotionPollMethod } from 'app/shared/models/motions/motion-poll';
import { PollType } from 'app/shared/models/poll/base-poll';
import { ViewMotionPoll } from 'app/site/motions/models/view-motion-poll';
import { ViewMotionVote } from 'app/site/motions/models/view-motion-vote';
import { BasePollVoteComponent } from 'app/site/polls/components/base-poll-vote.component';

interface VoteOption {
    vote: 'Y' | 'N' | 'A';
    css: string;
    icon: string;
    label: string;
}

@Component({
    selector: 'os-motion-poll-vote',
    templateUrl: './motion-poll-vote.component.html',
    styleUrls: ['./motion-poll-vote.component.scss']
})
export class MotionPollVoteComponent extends BasePollVoteComponent<ViewMotionPoll> implements OnInit {
    /**
     * holds the last saved vote
     *
     * TODO: There will be a bug. This has to be reset if the currently observed poll changes it's state back
     * to started
     */
    public currentVote: ViewMotionVote;

    public MotionPollMethod = MotionPollMethod;

    private votes: ViewMotionVote[];

    public voteOptions: VoteOption[] = [
        {
            vote: 'Y',
            css: 'voted-yes',
            icon: 'thumb_up',
            label: 'Yes'
        },
        {
            vote: 'N',
            css: 'voted-no',
            icon: 'thumb_down',
            label: 'No'
        },
        {
            vote: 'A',
            css: 'voted-abstain',
            icon: 'trip_origin',
            label: 'Abstain'
        }
    ];

    public constructor(
        title: Title,
        translate: TranslateService,
        matSnackbar: MatSnackBar,
        vmanager: VotingService,
        operator: OperatorService,
        private voteRepo: MotionVoteRepositoryService,
        private pollRepo: MotionPollRepositoryService,
        private promptService: PromptService
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
            this.currentVote = null;
            const filtered = this.votes.filter(
                vote => vote.option.poll_id === this.poll.id && vote.user_id === this.user.id
            );
            if (filtered.length) {
                if (filtered.length > 1) {
                    // output warning and continue to keep the error case user friendly
                    console.error('A user should never have more than one vote on the same poll.');
                }
                this.currentVote = filtered[0];
            }
        }
    }

    /**
     * TODO: 'Y' | 'N' | 'A' should refer to some ENUM
     */
    public saveVote(vote: 'Y' | 'N' | 'A'): void {
        if (this.poll.type === PollType.Pseudoanonymous) {
            const title = this.translate.instant('Are you sure?');
            const content = this.translate.instant('Your decision cannot be changed afterwards');
            this.promptService.open(title, content).then(confirmed => {
                if (confirmed) {
                    this.pollRepo.vote(vote, this.poll.id).catch(this.raiseError);
                }
            });
        } else {
            this.pollRepo.vote(vote, this.poll.id).catch(this.raiseError);
        }
    }
}
