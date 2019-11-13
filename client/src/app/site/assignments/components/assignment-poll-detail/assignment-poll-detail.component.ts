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

@Component({
    selector: 'os-assignment-poll-detail',
    templateUrl: './assignment-poll-detail.component.html',
    styleUrls: ['./assignment-poll-detail.component.scss']
})
export class AssignmentPollDetailComponent extends BasePollDetailComponent<ViewAssignmentPoll> {
    public votesByUser: { [key: number]: { user: ViewUser; votes: { [key: number]: ViewAssignmentVote } } };

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
        }, 1000);
    }
}
