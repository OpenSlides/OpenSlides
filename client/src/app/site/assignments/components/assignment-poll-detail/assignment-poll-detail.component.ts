import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';

import { OperatorService } from 'app/core/core-services/operator.service';
import { AssignmentPollRepositoryService } from 'app/core/repositories/assignments/assignment-poll-repository.service';
import { GroupRepositoryService } from 'app/core/repositories/users/group-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { ChartType } from 'app/shared/components/charts/charts.component';
import { AssignmentPollMethods } from 'app/shared/models/assignments/assignment-poll';
import { BasePollDetailComponent } from 'app/site/polls/components/base-poll-detail.component';
import { AssignmentPollDialogService } from '../../services/assignment-poll-dialog.service';
import { ViewAssignmentPoll } from '../../models/view-assignment-poll';

@Component({
    selector: 'os-assignment-poll-detail',
    templateUrl: './assignment-poll-detail.component.html',
    styleUrls: ['./assignment-poll-detail.component.scss']
})
export class AssignmentPollDetailComponent extends BasePollDetailComponent<ViewAssignmentPoll> {
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

    public columnDefinitionPerName: string[];

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
        private operator: OperatorService
    ) {
        super(title, translate, matSnackbar, repo, route, groupRepo, prompt, pollDialog);
    }

    public onPollWithOptionsLoaded(): void {
        this.columnDefinitionPerName = ['users'].concat(this.poll.options.map(option => 'votes-' + option.user_id));

        const votes = {};
        let i = -1;
        for (const option of this.poll.options) {
            for (const vote of option.votes) {
                // if poll was pseudoanonymized, use a negative index to not interfere with
                // possible named votes (although this should never happen)
                const userId = vote.user_id || --i;
                if (!votes[userId]) {
                    votes[userId] = {
                        user: vote.user,
                        votes: {}
                    };
                }
                votes[userId].votes[option.user_id] =
                    this.poll.pollmethod === AssignmentPollMethods.Votes ? vote.weight : vote.valueVerbose;
            }
        }

        this.setVotesData(Object.values(votes));

        this.candidatesLabels = this.poll.initChartLabels();

        this.isReady = true;
    }

    protected initChartData(): void {
        if (this.isVotedPoll) {
            this._chartType = 'doughnut';
            this.chartDataSubject.next(this.poll.generateCircleChartData());
        }
    }

    protected hasPerms(): boolean {
        return this.operator.hasPerms('assignments.can_manage');
    }
}
