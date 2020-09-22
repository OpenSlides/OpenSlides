import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { OperatorService } from 'app/core/core-services/operator.service';
import { MotionPollRepositoryService } from 'app/core/repositories/motions/motion-poll-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { VotingService } from 'app/core/ui-services/voting.service';
import { VoteValue } from 'app/shared/models/poll/base-vote';
import { ViewMotionPoll } from 'app/site/motions/models/view-motion-poll';
import { BasePollVoteComponentDirective, VoteOption } from 'app/site/polls/components/base-poll-vote.component';
import { ViewUser } from 'app/site/users/models/view-user';

@Component({
    selector: 'os-motion-poll-vote',
    templateUrl: './motion-poll-vote.component.html',
    styleUrls: ['./motion-poll-vote.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MotionPollVoteComponent extends BasePollVoteComponentDirective<ViewMotionPoll> implements OnInit {
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
        operator: OperatorService,
        public votingService: VotingService,
        private pollRepo: MotionPollRepositoryService,
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
        this.cd.markForCheck();
    }

    public getActionButtonClass(voteOption: VoteOption, user: ViewUser = this.user): string {
        if (this.voteRequestData[user.id]?.vote === voteOption.vote) {
            return voteOption.css;
        }
        return '';
    }

    public async saveVote(vote: VoteValue, user: ViewUser = this.user): Promise<void> {
        if (this.voteRequestData[user.id]) {
            this.voteRequestData[user.id].vote = vote;

            const title = this.translate.instant('Submit selection now?');
            const content = this.translate.instant('Your decision cannot be changed afterwards.');
            const confirmed = await this.promptService.open(title, content);

            if (confirmed) {
                this.deliveringVote[user.id] = true;
                this.cd.markForCheck();

                this.pollRepo
                    .vote(vote, this.poll.id, user.id)
                    .then(() => {
                        this.alreadyVoted[user.id] = true;
                    })
                    .catch(this.raiseError)
                    .finally(() => {
                        this.deliveringVote[user.id] = false;
                        this.cd.markForCheck();
                    });
            }
        }
    }
}
