import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { OperatorService } from 'app/core/core-services/operator.service';
import {
    AssignmentPollRepositoryService,
    GlobalVote,
    VotingData
} from 'app/core/repositories/assignments/assignment-poll-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { VotingService } from 'app/core/ui-services/voting.service';
import { AssignmentPollMethod } from 'app/shared/models/assignments/assignment-poll';
import { PollType } from 'app/shared/models/poll/base-poll';
import { VoteValue } from 'app/shared/models/poll/base-vote';
import { BasePollVoteComponent } from 'app/site/polls/components/base-poll-vote.component';
import { ViewAssignmentPoll } from '../../models/view-assignment-poll';

// TODO: Duplicate
interface VoteActions {
    vote: VoteValue;
    css: string;
    icon: string;
    label: string;
}

@Component({
    selector: 'os-assignment-poll-vote',
    templateUrl: './assignment-poll-vote.component.html',
    styleUrls: ['./assignment-poll-vote.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssignmentPollVoteComponent extends BasePollVoteComponent<ViewAssignmentPoll> implements OnInit {
    public AssignmentPollMethod = AssignmentPollMethod;
    public PollType = PollType;
    public voteActions: VoteActions[] = [];
    public voteRequestData: VotingData = {
        votes: {}
    };
    public alreadyVoted: boolean;

    public constructor(
        title: Title,
        protected translate: TranslateService,
        matSnackbar: MatSnackBar,
        operator: OperatorService,
        public vmanager: VotingService,
        private pollRepo: AssignmentPollRepositoryService,
        private promptService: PromptService,
        private cd: ChangeDetectorRef
    ) {
        super(title, translate, matSnackbar, operator);
    }

    public ngOnInit(): void {
        if (this.poll && !this.poll.user_has_voted) {
            this.alreadyVoted = false;
            this.defineVoteOptions();
        } else {
            this.alreadyVoted = true;
            this.cd.markForCheck();
        }
    }

    public get pollHint(): string {
        return this.poll.assignment.default_poll_description;
    }

    private defineVoteOptions(): void {
        this.voteActions.push({
            vote: 'Y',
            css: 'voted-yes',
            icon: 'thumb_up',
            label: 'Yes'
        });

        if (this.poll.pollmethod !== AssignmentPollMethod.Votes) {
            this.voteActions.push({
                vote: 'N',
                css: 'voted-no',
                icon: 'thumb_down',
                label: 'No'
            });
        }

        if (this.poll.pollmethod === AssignmentPollMethod.YNA) {
            this.voteActions.push({
                vote: 'A',
                css: 'voted-abstain',
                icon: 'trip_origin',
                label: 'Abstain'
            });
        }
    }

    public getVotesCount(): number {
        return Object.keys(this.voteRequestData.votes).filter(key => this.voteRequestData.votes[key]).length;
    }

    public getVotesAvailable(): number {
        return this.poll.votes_amount - this.getVotesCount();
    }

    private isGlobalOptionSelected(): boolean {
        return !!this.voteRequestData.global;
    }

    public async submitVote(): Promise<void> {
        const title = this.translate.instant('Submit selection now?');
        const content = this.translate.instant('Your decision cannot be changed afterwards.');
        const confirmed = await this.promptService.open(title, content);
        if (confirmed) {
            this.deliveringVote = true;
            this.cd.markForCheck();
            this.pollRepo
                .vote(this.voteRequestData, this.poll.id)
                .then(() => {
                    this.alreadyVoted = true;
                })
                .catch(this.raiseError)
                .finally(() => {
                    this.deliveringVote = false;
                });
        }
    }

    public saveSingleVote(optionId: number, vote: VoteValue): void {
        if (this.isGlobalOptionSelected()) {
            delete this.voteRequestData.global;
        }

        if (this.poll.pollmethod === AssignmentPollMethod.Votes) {
            const votesAmount = this.poll.votes_amount;
            const tmpVoteRequest = this.poll.options
                .map(option => option.id)
                .reduce((o, n) => {
                    o[n] = 0;
                    if (votesAmount === 1) {
                        if (n === optionId && this.voteRequestData.votes[n] !== 1) {
                            o[n] = 1;
                        }
                    } else if ((n === optionId) !== (this.voteRequestData.votes[n] === 1)) {
                        o[n] = 1;
                    }

                    return o;
                }, {});

            // check if you can still vote
            const countedVotes = Object.keys(tmpVoteRequest).filter(key => tmpVoteRequest[key]).length;
            if (countedVotes <= votesAmount) {
                this.voteRequestData.votes = tmpVoteRequest;

                // if you have no options anymore, try to send
                if (this.getVotesCount() === votesAmount) {
                    this.submitVote();
                }
            } else {
                this.raiseError(
                    this.translate.instant('You reached the maximum amount of votes. Deselect somebody first.')
                );
            }
        } else {
            // YN/YNA
            if (this.voteRequestData.votes[optionId] && this.voteRequestData.votes[optionId] === vote) {
                delete this.voteRequestData.votes[optionId];
            } else {
                this.voteRequestData.votes[optionId] = vote;
            }

            // if you filled out every option, try to send
            if (Object.keys(this.voteRequestData.votes).length === this.poll.options.length) {
                this.submitVote();
            }
        }
    }

    public saveGlobalVote(globalVote: GlobalVote): void {
        this.voteRequestData.votes = {};
        if (this.voteRequestData.global && this.voteRequestData.global === globalVote) {
            delete this.voteRequestData.global;
        } else {
            this.voteRequestData.global = globalVote;
            this.submitVote();
        }
    }
}
