import { Component, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { PblColumnDefinition } from '@pebula/ngrid';

import { OperatorService } from 'app/core/core-services/operator.service';
import { AssignmentPollRepositoryService } from 'app/core/repositories/assignments/assignment-poll-repository.service';
import { GroupRepositoryService } from 'app/core/repositories/users/group-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { ViewportService } from 'app/core/ui-services/viewport.service';
import { ChartType } from 'app/shared/components/charts/charts.component';
import { AssignmentPollMethods } from 'app/shared/models/assignments/assignment-poll';
import { BasePollDetailComponent } from 'app/site/polls/components/base-poll-detail.component';
import { AssignmentPollDialogService } from '../../services/assignment-poll-dialog.service';
import { ViewAssignmentPoll } from '../../models/view-assignment-poll';

@Component({
    selector: 'os-assignment-poll-detail',
    templateUrl: './assignment-poll-detail.component.html',
    styleUrls: ['./assignment-poll-detail.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class AssignmentPollDetailComponent extends BasePollDetailComponent<ViewAssignmentPoll> {
    public AssignmentPollMethods = AssignmentPollMethods;

    public columnDefinitionSingleVotes: PblColumnDefinition[];

    public filterProps = ['user.getFullName'];

    public isReady = false;

    public candidatesLabels: string[] = [];

    public get chartType(): ChartType {
        return this._chartType;
    }

    public get isVotedPoll(): boolean {
        return this.poll.pollmethod === AssignmentPollMethods.Votes;
    }

    public get columnDefinitionOverview(): string[] {
        const columns = this.isVotedPoll ? ['user', 'votes'] : ['user', 'yes', 'no'];
        if (this.poll.pollmethod === AssignmentPollMethods.YNA) {
            columns.splice(3, 0, 'abstain');
        }
        return columns;
    }
    private _chartType: ChartType = 'horizontalBar';

    public constructor(
        title: Title,
        translate: TranslateService,
        matSnackbar: MatSnackBar,
        repo: AssignmentPollRepositoryService,
        route: ActivatedRoute,
        groupRepo: GroupRepositoryService,
        prompt: PromptService,
        pollDialog: AssignmentPollDialogService,
        private operator: OperatorService,
        private viewport: ViewportService
    ) {
        super(title, translate, matSnackbar, repo, route, groupRepo, prompt, pollDialog);
    }

    public onPollWithOptionsLoaded(): void {
        const votes = {};
        let i = -1;

        this.columnDefinitionSingleVotes = [
            {
                prop: 'user',
                label: 'Participant',
                width: '180px',
                pin: this.viewport.isMobile ? undefined : 'start'
            }
        ];
        if (this.isVotedPoll) {
            this.columnDefinitionSingleVotes.push(this.getVoteColumnDefinition('votes', 'Votes'));
        }

        /**
         * builds an object of the following form:
         * {
         *     userId: {
         *         user: ViewUser,
         *         votes: { candidateId: voteValue }    // for YN(A)
         *              | candidate_name[]              // for Votes
         *     }
         * }
         */
        for (const option of this.poll.options) {
            if (!this.isVotedPoll) {
                this.columnDefinitionSingleVotes.push(
                    this.getVoteColumnDefinition('votes-' + option.user_id, option.user.getFullName())
                );
            }

            for (const vote of option.votes) {
                // if poll was pseudoanonymized, use a negative index to not interfere with
                // possible named votes (although this should never happen)
                const userId = vote.user_id || --i;
                if (!votes[userId]) {
                    votes[userId] = {
                        user: vote.user,
                        votes: this.isVotedPoll ? [] : {}
                    };
                }
                // on votes method, we fill an array with all chosen candidates
                // on YN(A) we map candidate ids to the vote
                if (this.isVotedPoll) {
                    if (vote.weight > 0) {
                        if (vote.value === 'Y') {
                            votes[userId].votes.push(option.user.getFullName());
                        } else if (vote.value === 'N') {
                            votes[userId].votes.push(this.translate.instant('No'));
                        } else if (vote.value === 'A') {
                            votes[userId].votes.push(this.translate.instant('Abstain'));
                        }
                    }
                } else {
                    votes[userId].votes[option.user_id] = vote;
                }
            }
        }

        this.setVotesData(Object.values(votes));

        this.candidatesLabels = this.poll.initChartLabels();

        this.isReady = true;
    }

    private getVoteColumnDefinition(prop: string, label: string): PblColumnDefinition {
        return {
            prop: prop,
            label: label,
            minWidth: 80,
            width: 'auto'
        };
    }

    protected initChartData(): void {
        if (this.isVotedPoll) {
            this._chartType = 'doughnut';
            this.chartDataSubject.next(this.poll.generateCircleChartData());
        } else {
            super.initChartData();
        }
    }

    protected hasPerms(): boolean {
        return this.operator.hasPerms('assignments.can_manage');
    }
}
