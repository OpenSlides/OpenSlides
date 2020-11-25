import { Directive, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { OperatorService } from 'app/core/core-services/operator.service';
import { VotingData } from 'app/core/repositories/assignments/assignment-poll-repository.service';
import { VotingError, VotingService } from 'app/core/ui-services/voting.service';
import { VoteValue } from 'app/shared/models/poll/base-vote';
import { BaseViewComponentDirective } from 'app/site/base/base-view';
import { ViewUser } from 'app/site/users/models/view-user';
import { PollPropertyVerbose, ViewBasePoll } from '../models/view-base-poll';

export interface VoteOption {
    vote?: VoteValue;
    css?: string;
    icon?: string;
    label?: string;
}

@Directive()
export abstract class BasePollVoteComponentDirective<V extends ViewBasePoll> extends BaseViewComponentDirective {
    @Input()
    public poll: V;

    public votingErrors = VotingError;

    protected voteRequestData = {};

    protected alreadyVoted = {};

    protected deliveringVote = {};

    protected user: ViewUser;

    protected delegations: ViewUser[];

    public PollPropertyVerbose = PollPropertyVerbose;

    public constructor(
        title: Title,
        translate: TranslateService,
        matSnackbar: MatSnackBar,
        operator: OperatorService,
        protected votingService: VotingService
    ) {
        super(title, translate, matSnackbar);

        this.subscriptions.push(
            operator.getViewUserObservable().subscribe(user => {
                if (user) {
                    this.user = user;
                    this.delegations = user.voteDelegationsFrom;
                }
            })
        );
    }

    protected createVotingDataObjects(): void {
        if (this.user) {
            this.voteRequestData[this.user.id] = {
                votes: {}
            } as VotingData;
            this.alreadyVoted[this.user.id] = this.poll.user_has_voted;
            this.deliveringVote[this.user.id] = false;
        }

        if (this.delegations) {
            for (const delegation of this.delegations) {
                this.voteRequestData[delegation.id] = {
                    votes: {}
                } as VotingData;
                this.alreadyVoted[delegation.id] = this.poll.hasVotedId(delegation.id);
                this.deliveringVote[delegation.id] = false;
            }
        }
    }

    public isDeliveringVote(user: ViewUser = this.user): boolean {
        return this.deliveringVote[user.id] === true;
    }

    public hasAlreadyVoted(user: ViewUser = this.user): boolean {
        return this.alreadyVoted[user.id] === true;
    }

    public canVote(user: ViewUser = this.user): boolean {
        return (
            this.votingService.canVote(this.poll, user) && !this.isDeliveringVote(user) && !this.hasAlreadyVoted(user)
        );
    }

    public getVotingError(user: ViewUser = this.user): string | void {
        console.log('Cannot vote because:', this.votingService.getVotePermissionErrorVerbose(this.poll, user));
        return this.votingService.getVotePermissionErrorVerbose(this.poll, user);
    }
}
