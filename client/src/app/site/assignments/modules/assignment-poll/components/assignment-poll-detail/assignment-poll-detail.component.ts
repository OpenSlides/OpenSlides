import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { marker as _ } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { PblColumnDefinition } from '@pebula/ngrid';

import { OperatorService, Permission } from 'app/core/core-services/operator.service';
import { AssignmentPollRepositoryService } from 'app/core/repositories/assignments/assignment-poll-repository.service';
import { AssignmentVoteRepositoryService } from 'app/core/repositories/assignments/assignment-vote-repository.service';
import { GroupRepositoryService } from 'app/core/repositories/users/group-repository.service';
import { UserRepositoryService } from 'app/core/repositories/users/user-repository.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { ChartData } from 'app/shared/components/charts/charts.component';
import { VoteValue } from 'app/shared/models/poll/base-vote';
import { ViewAssignmentPoll } from 'app/site/assignments/models/view-assignment-poll';
import { BasePollDetailComponentDirective } from 'app/site/polls/components/base-poll-detail.component';
import { AssignmentPollDialogService } from '../../services/assignment-poll-dialog.service';
import { AssignmentPollService } from '../../services/assignment-poll.service';

@Component({
    selector: 'os-assignment-poll-detail',
    templateUrl: './assignment-poll-detail.component.html',
    styleUrls: ['./assignment-poll-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
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

    public get showResults(): boolean {
        return this.hasPerms() || this.poll.isPublished;
    }

    public get chartData(): ChartData {
        return this.pollService.generateChartData(this.poll);
    }

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
        protected operator: OperatorService,
        private router: Router,
        protected cd: ChangeDetectorRef,
        protected userRepo: UserRepositoryService
    ) {
        super(
            title,
            translate,
            matSnackbar,
            repo,
            route,
            groupRepo,
            prompt,
            pollDialog,
            pollService,
            votesRepo,
            operator,
            cd,
            userRepo
        );
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
        for (const option of this.poll.options) {
            for (const vote of option.votes) {
                const token = vote.user_token;
                if (!token) {
                    throw new Error(`assignment_vote/${vote.id} does not contain a user_token`);
                }
                if (!votes[token]) {
                    votes[token] = {
                        user: vote.user,
                        votes: []
                    };
                }

                if (vote.weight > 0) {
                    if (this.poll.isMethodY) {
                        if (vote.value === 'Y') {
                            votes[token].votes.push(option.user.getFullName());
                        } else {
                            votes[token].votes.push(this.voteValueToLabel(vote.value));
                        }
                    } else {
                        const candidate_name = option.user?.getShortName() ?? this.translate.instant('Deleted user');
                        votes[token].votes.push(`${candidate_name}: ${this.voteValueToLabel(vote.value)}`);
                    }
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
