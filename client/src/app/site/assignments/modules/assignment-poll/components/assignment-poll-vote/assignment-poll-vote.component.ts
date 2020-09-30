import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { OperatorService } from 'app/core/core-services/operator.service';
import {
    AssignmentPollRepositoryService,
    GlobalVote
} from 'app/core/repositories/assignments/assignment-poll-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { VotingService } from 'app/core/ui-services/voting.service';
import { AssignmentPollMethod } from 'app/shared/models/assignments/assignment-poll';
import { PollType } from 'app/shared/models/poll/base-poll';
import { VoteValue } from 'app/shared/models/poll/base-vote';
import { ViewAssignmentOption } from 'app/site/assignments/models/view-assignment-option';
import { ViewAssignmentPoll } from 'app/site/assignments/models/view-assignment-poll';
import { BasePollVoteComponentDirective, VoteOption } from 'app/site/polls/components/base-poll-vote.component';
import { ViewUser } from 'app/site/users/models/view-user';

@Component({
    selector: 'os-assignment-poll-vote',
    templateUrl: './assignment-poll-vote.component.html',
    styleUrls: ['./assignment-poll-vote.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssignmentPollVoteComponent extends BasePollVoteComponentDirective<ViewAssignmentPoll> implements OnInit {
    public AssignmentPollMethod = AssignmentPollMethod;
    public PollType = PollType;
    public voteActions: VoteOption[] = [];

    public get pollHint(): string {
        return this.poll.assignment.default_poll_description;
    }

    public constructor(
        title: Title,
        protected translate: TranslateService,
        matSnackbar: MatSnackBar,
        operator: OperatorService,
        votingService: VotingService,
        private pollRepo: AssignmentPollRepositoryService,
        private promptService: PromptService,
        private cd: ChangeDetectorRef
    ) {
        super(title, translate, matSnackbar, operator, votingService);

        // observe user updates to refresh the view on dynamic changes
        this.subscriptions.push(
            operator.getViewUserObservable().subscribe(() => {
                this.cd.markForCheck();
            })
        );
    }

    public ngOnInit(): void {
        this.createVotingDataObjects();
        this.defineVoteOptions();
        this.cd.markForCheck();
    }

    public getActionButtonClass(actions: VoteOption, option: ViewAssignmentOption, user: ViewUser = this.user): string {
        if (
            this.voteRequestData[user.id]?.votes[option.id] === actions.vote ||
            this.voteRequestData[user.id]?.votes[option.id] === 1
        ) {
            return actions.css;
        }
        return '';
    }

    public getGlobalAbstainClass(user: ViewUser = this.user): string {
        if (this.voteRequestData[user.id]?.global === 'A') {
            return 'voted-abstain';
        }
        return '';
    }

    public getGlobalNoClass(user: ViewUser = this.user): string {
        if (this.voteRequestData[user.id]?.global === 'N') {
            return 'voted-no';
        }
        return '';
    }

    private defineVoteOptions(): void {
        this.voteActions.push({
            vote: 'Y',
            css: 'voted-yes',
            icon: 'thumb_up',
            label: 'Yes'
        });

        if (this.poll?.pollmethod !== AssignmentPollMethod.Votes) {
            this.voteActions.push({
                vote: 'N',
                css: 'voted-no',
                icon: 'thumb_down',
                label: 'No'
            });
        }

        if (this.poll?.pollmethod === AssignmentPollMethod.YNA) {
            this.voteActions.push({
                vote: 'A',
                css: 'voted-abstain',
                icon: 'trip_origin',
                label: 'Abstain'
            });
        }
    }

    public getVotesCount(user: ViewUser = this.user): number {
        if (this.voteRequestData[user.id]) {
            return Object.keys(this.voteRequestData[user.id].votes).filter(
                key => this.voteRequestData[user.id].votes[key]
            ).length;
        }
    }

    public getVotesAvailable(user: ViewUser = this.user): number {
        return this.poll.votes_amount - this.getVotesCount(user);
    }

    private isGlobalOptionSelected(user: ViewUser = this.user): boolean {
        return !!this.voteRequestData[user.id]?.global;
    }

    public async submitVote(user: ViewUser = this.user): Promise<void> {
        const title = this.translate.instant('Submit selection now?');
        const content = this.translate.instant('Your decision cannot be changed afterwards.');
        const confirmed = await this.promptService.open(title, content);
        if (confirmed) {
            this.deliveringVote[user.id] = true;
            this.cd.markForCheck();
            this.pollRepo
                .vote(this.voteRequestData[user.id], this.poll.id, user.id)
                .then(() => {
                    this.alreadyVoted[user.id] = true;
                })
                .catch(this.raiseError)
                .finally(() => {
                    this.deliveringVote[user.id] = false;
                });
        }
    }

    public saveSingleVote(optionId: number, vote: VoteValue, user: ViewUser = this.user): void {
        if (!this.voteRequestData[user.id]) {
            throw new Error('The user for your voting request does not exist');
        }

        if (this.isGlobalOptionSelected(user)) {
            delete this.voteRequestData[user.id].global;
        }

        if (this.poll.pollmethod === AssignmentPollMethod.Votes) {
            const votesAmount = this.poll.votes_amount;
            const tmpVoteRequest = this.poll.options
                .map(option => option.id)
                .reduce((o, n) => {
                    o[n] = 0;
                    if (votesAmount === 1) {
                        if (n === optionId && this.voteRequestData[user.id].votes[n] !== 1) {
                            o[n] = 1;
                        }
                    } else if ((n === optionId) !== (this.voteRequestData[user.id].votes[n] === 1)) {
                        o[n] = 1;
                    }

                    return o;
                }, {});

            // check if you can still vote
            const countedVotes = Object.keys(tmpVoteRequest).filter(key => tmpVoteRequest[key]).length;
            if (countedVotes <= votesAmount) {
                this.voteRequestData[user.id].votes = tmpVoteRequest;

                // if you have no options anymore, try to send
                if (this.getVotesCount(user) === votesAmount) {
                    this.submitVote(user);
                }
            } else {
                this.raiseError(
                    this.translate.instant('You reached the maximum amount of votes. Deselect somebody first.')
                );
            }
        } else {
            // YN/YNA
            if (
                this.voteRequestData[user.id].votes[optionId] &&
                this.voteRequestData[user.id].votes[optionId] === vote
            ) {
                delete this.voteRequestData[user.id].votes[optionId];
            } else {
                this.voteRequestData[user.id].votes[optionId] = vote;
            }

            // if you filled out every option, try to send
            if (Object.keys(this.voteRequestData[user.id].votes).length === this.poll.options.length) {
                this.submitVote(user);
            }
        }
    }

    public saveGlobalVote(globalVote: GlobalVote, user: ViewUser = this.user): void {
        this.voteRequestData[user.id].votes = {};
        if (this.voteRequestData[user.id].global && this.voteRequestData[user.id].global === globalVote) {
            delete this.voteRequestData[user.id].global;
        } else {
            this.voteRequestData[user.id].global = globalVote;
            this.submitVote(user);
        }
    }
}
