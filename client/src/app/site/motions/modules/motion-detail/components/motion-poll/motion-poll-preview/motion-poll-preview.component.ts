import { Component, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';

import { MotionPollRepositoryService } from 'app/core/repositories/motions/motion-poll-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { PollType } from 'app/shared/models/poll/base-poll';
import { BaseViewComponent } from 'app/site/base/base-view';
import { ViewMotionPoll } from 'app/site/motions/models/view-motion-poll';

@Component({
    selector: 'os-motion-poll-preview',
    templateUrl: './motion-poll-preview.component.html',
    styleUrls: ['./motion-poll-preview.component.scss']
})
export class MotionPollPreviewComponent extends BaseViewComponent {
    @Input()
    public poll: ViewMotionPoll;

    public pollTypes = PollType;

    public constructor(
        title: Title,
        protected translate: TranslateService,
        matSnackbar: MatSnackBar,
        private repo: MotionPollRepositoryService,
        private promptDialog: PromptService,
        private router: Router
    ) {
        super(title, translate, matSnackbar);
    }

    public openPoll(): void {
        this.router.navigate(['motions', 'polls', this.poll.id]);
    }

    public editPoll(): void {
        this.router.navigate(['motions', 'polls', this.poll.id], { queryParams: { edit: true } });
    }

    public async deletePoll(): Promise<void> {
        const title = 'Delete poll';
        const text = 'Do you really want to delete the selected poll?';

        if (await this.promptDialog.open(title, text)) {
            await this.repo.delete(this.poll);
        }
    }

    public enterAnalogVotes(): void {
        throw new Error('TODO');
    }
}
