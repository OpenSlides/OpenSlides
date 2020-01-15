import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';

import { AssignmentPollRepositoryService } from 'app/core/repositories/assignments/assignment-poll-repository.service';
import { GroupRepositoryService } from 'app/core/repositories/users/group-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { AssignmentPollMethods } from 'app/shared/models/assignments/assignment-poll';
import { BasePollDetailComponent } from 'app/site/polls/components/base-poll-detail.component';
import { ViewUser } from 'app/site/users/models/view-user';
import { ViewAssignmentPoll } from '../../models/view-assignment-poll';
import { ViewAssignmentVote } from '../../models/view-assignment-vote';
import { ChartType } from 'app/shared/components/charts/charts.component';

@Component({
    selector: 'os-assignment-poll-detail',
    templateUrl: './assignment-poll-detail.component.html',
    styleUrls: ['./assignment-poll-detail.component.scss']
})
export class AssignmentPollDetailComponent extends BasePollDetailComponent<ViewAssignmentPoll> {
    public isReady = false;

    public votesByUser: { [key: number]: { user: ViewUser; votes: { [key: number]: ViewAssignmentVote } } };

    public get chartType(): ChartType {
        return 'horizontalBar';
    }

    public get columnDefinition(): string[] {
        const columns = ['user', 'yes', 'no', 'quorum'];
        if (this.poll.pollmethod === AssignmentPollMethods.YNA) {
            columns.splice(3, 0, 'abstain');
        }
        return columns;
    }

    public constructor(
        title: Title,
        translate: TranslateService,
        matSnackbar: MatSnackBar,
        repo: AssignmentPollRepositoryService,
        route: ActivatedRoute,
        groupRepo: GroupRepositoryService,
        prompt: PromptService
    ) {
        super(title, translate, matSnackbar, repo, route, groupRepo, prompt);
    }

    public onPollLoaded(): void {
        const votes = {};

        setTimeout(() => {
            for (const option of this.poll.options) {
                for (const vote of option.votes) {
                    if (!votes[vote.user_id]) {
                        votes[vote.user_id] = {
                            user: vote.user,
                            votes: {}
                        };
                    }
                    votes[vote.user_id].votes[option.user_id] =
                        this.poll.pollmethod === AssignmentPollMethods.Votes ? vote.weight : vote.valueVerbose;
                }
            }
            console.log(votes, this.poll, this.poll.options);
            this.votesByUser = votes;
            this.isReady = true;
        });
    }
}
