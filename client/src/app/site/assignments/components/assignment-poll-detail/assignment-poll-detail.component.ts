import { Component, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { PblColumnDefinition } from '@pebula/ngrid';

import { OperatorService } from 'app/core/core-services/operator.service';
import { AssignmentPollRepositoryService } from 'app/core/repositories/assignments/assignment-poll-repository.service';
import { AssignmentVoteRepositoryService } from 'app/core/repositories/assignments/assignment-vote-repository.service';
import { GroupRepositoryService } from 'app/core/repositories/users/group-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { ChartType } from 'app/shared/components/charts/charts.component';
import { BasePollDetailComponent } from 'app/site/polls/components/base-poll-detail.component';
import { PollService, PollTableData, VotingResult } from 'app/site/polls/services/poll.service';
import { AssignmentPollDialogService } from '../../services/assignment-poll-dialog.service';
import { AssignmentPollService } from '../../services/assignment-poll.service';
import { ViewAssignmentPoll } from '../../models/view-assignment-poll';

@Component({
    selector: 'os-assignment-poll-detail',
    templateUrl: './assignment-poll-detail.component.html',
    styleUrls: ['./assignment-poll-detail.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class AssignmentPollDetailComponent extends BasePollDetailComponent<ViewAssignmentPoll> {
    public columnDefinitionSingleVotes: PblColumnDefinition[];

    public filterProps = ['user.getFullName'];

    public isReady = false;

    public candidatesLabels: string[] = [];

    public get chartType(): ChartType {
        return 'stackedBar';
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
        pollService: PollService,
        votesRepo: AssignmentVoteRepositoryService,
        private operator: OperatorService,
        private assignmentPollService: AssignmentPollService
    ) {
        super(title, translate, matSnackbar, repo, route, groupRepo, prompt, pollDialog, pollService, votesRepo);
    }

    protected createVotesData(): void {
        const votes = {};
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

        for (const option of this.poll.options) {
            for (const vote of option.votes) {
                const userId = vote.user_id;
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
                        votes[userId].votes.push(`${option.user.getShortName()}: ${this.voteValueToLabel(vote.value)}`);
                    }
                }
            }
        }

        this.setVotesData(Object.values(votes));
        this.candidatesLabels = this.pollService.getChartLabels(this.poll);
        this.columnDefinitionSingleVotes = definitions;
        this.isReady = true;
    }

    private voteValueToLabel(vote: 'Y' | 'N' | 'A'): string {
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
        return this.operator.hasPerms('assignments.can_manage');
    }

    public getVoteClass(votingResult: VotingResult): string {
        const cssPrefix = 'voted-';
        return `${cssPrefix}${votingResult.vote}`;
    }

    public voteFitsMethod(result: VotingResult): boolean {
        if (this.poll.isMethodY) {
            if (result.vote === 'abstain' || result.vote === 'no') {
                return false;
            }
        } else if (this.poll.isMethodYN) {
            if (result.vote === 'abstain') {
                return false;
            }
        }
        return true;
    }

    public getTableData(): PollTableData[] {
        return this.assignmentPollService.generateTableData(this.poll);
    }
}
