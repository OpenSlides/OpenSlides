import { Component, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { PblColumnDefinition } from '@pebula/ngrid';

import { OperatorService, Permission } from 'app/core/core-services/operator.service';
import { AssignmentPollRepositoryService } from 'app/core/repositories/assignments/assignment-poll-repository.service';
import { AssignmentVoteRepositoryService } from 'app/core/repositories/assignments/assignment-vote-repository.service';
import { GroupRepositoryService } from 'app/core/repositories/users/group-repository.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { VoteValue } from 'app/shared/models/poll/base-vote';
import { ViewAssignmentPoll } from 'app/site/assignments/models/view-assignment-poll';
import { BasePollDetailComponentDirective } from 'app/site/polls/components/base-poll-detail.component';
import { AssignmentPollDialogService } from '../../services/assignment-poll-dialog.service';
import { AssignmentPollService } from '../../services/assignment-poll.service';

@Component({
    selector: 'os-assignment-poll-detail',
    templateUrl: './assignment-poll-detail.component.html',
    styleUrls: ['./assignment-poll-detail.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class AssignmentPollDetailComponent extends BasePollDetailComponentDirective<
    ViewAssignmentPoll,
    AssignmentPollService
> {
    public columnDefinitionSingleVotes: PblColumnDefinition[];

    public filterProps = ['user.getFullName'];

    public isReady = false;

    public candidatesLabels: string[] = [];

    public isVoteWeightActive: boolean;

    public constructor(
        title: Title,
        translate: TranslateService,
        matSnackbar: MatSnackBar,
        repo: AssignmentPollRepositoryService,
        route: ActivatedRoute,
        groupRepo: GroupRepositoryService,
        prompt: PromptService,
        pollDialog: AssignmentPollDialogService,
        configService: ConfigService,
        protected pollService: AssignmentPollService,
        votesRepo: AssignmentVoteRepositoryService,
        private operator: OperatorService,
        private router: Router
    ) {
        super(title, translate, matSnackbar, repo, route, groupRepo, prompt, pollDialog, pollService, votesRepo);
        configService
            .get<boolean>('users_activate_vote_weight')
            .subscribe(active => (this.isVoteWeightActive = active));
    }

    protected createVotesData(): void {
        const definitions: PblColumnDefinition[] = [
            {
                prop: 'user',
                label: 'Participant',
                width: '40%',
                minWidth: 300
            },
            {
                prop: 'votes',
                label: 'Votes',
                width: '60%',
                minWidth: 300
            }
        ];

        const votes = {};
        let isPseudoanonymized = true;
        for (const option of this.poll.options) {
            for (const vote of option.votes) {
                const userId = vote.user_id;
                if (userId) {
                    isPseudoanonymized = false;
                    if (!votes[userId]) {
                        votes[userId] = {
                            user: vote.user,
                            votes: []
                        };
                    }

                    if (vote.weight > 0) {
                        if (this.poll.isMethodY) {
                            if (vote.value === 'Y') {
                                votes[userId].votes.push(option.user.getFullName());
                            } else {
                                votes[userId].votes.push(this.voteValueToLabel(vote.value));
                            }
                        } else {
                            votes[userId].votes.push(
                                `${option.user.getShortName()}: ${this.voteValueToLabel(vote.value)}`
                            );
                        }
                    }
                }
            }
        }
        // if the poll was not pseudoanonymized, add all other users as empty votes
        if (!isPseudoanonymized) {
            for (const user of this.poll.voted) {
                if (!votes[user.id]) {
                    votes[user.id] = {
                        user: user,
                        votes: [this.translate.instant('empty vote')]
                    };
                }
            }
        }

        this.setVotesData(Object.values(votes));
        this.candidatesLabels = this.pollService.getChartLabels(this.poll);
        this.columnDefinitionSingleVotes = definitions;
        this.isReady = true;
    }

    private voteValueToLabel(vote: VoteValue): string {
        if (vote === 'Y') {
            return this.translate.instant('Yes');
        } else if (vote === 'N') {
            return this.translate.instant('No');
        } else if (vote === 'A') {
            return this.translate.instant('Abstain');
        } else {
            throw new Error(`voteValueToLabel received illegal arguments: ${vote}`);
        }
    }

    protected hasPerms(): boolean {
        return this.operator.hasPerms(Permission.assignmentsCanManage);
    }

    protected onDeleted(): void {
        this.router.navigate(['assignments', this.poll.assignment_id]);
    }
}
