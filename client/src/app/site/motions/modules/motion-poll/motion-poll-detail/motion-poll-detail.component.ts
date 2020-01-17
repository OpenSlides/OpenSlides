import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';

import { OperatorService } from 'app/core/core-services/operator.service';
import { MotionPollRepositoryService } from 'app/core/repositories/motions/motion-poll-repository.service';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { GroupRepositoryService } from 'app/core/repositories/users/group-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';
import { ChartType } from 'app/shared/components/charts/charts.component';
import { ViewMotionPoll } from 'app/site/motions/models/view-motion-poll';
import { MotionPollDialogService } from 'app/site/motions/services/motion-poll-dialog.service';
import { BasePollDetailComponent } from 'app/site/polls/components/base-poll-detail.component';
// import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';

@Component({
    selector: 'os-motion-poll-detail',
    templateUrl: './motion-poll-detail.component.html',
    styleUrls: ['./motion-poll-detail.component.scss']
})
export class MotionPollDetailComponent extends BasePollDetailComponent<ViewMotionPoll> implements OnInit {
    public motionTitle = '';
    public columnDefinition = ['key', 'value'];

    public set chartType(type: ChartType) {
        this._chartType = type;
    }

    public get chartType(): ChartType {
        return this._chartType;
    }

    private _chartType: ChartType = 'doughnut';

    public constructor(
        title: Title,
        translate: TranslateService,
        matSnackbar: MatSnackBar,
        repo: MotionPollRepositoryService,
        route: ActivatedRoute,
        groupRepo: GroupRepositoryService,
        prompt: PromptService,
        pollDialog: MotionPollDialogService,
        private operator: OperatorService,
        private router: Router,
        private motionRepo: MotionRepositoryService
    ) {
        super(title, translate, matSnackbar, repo, route, groupRepo, prompt, pollDialog);
    }

    protected onPollLoaded(): void {
        this.motionTitle = this.motionRepo.getViewModel((<ViewMotionPoll>this.poll).motion_id).getTitle();
    }

    public openDialog(): void {
        this.pollDialog.openDialog(this.poll);
    }

    protected onDeleted(): void {
        this.router.navigate(['motions', (<ViewMotionPoll>this.poll).motion_id]);
    }

    protected hasPerms(): boolean {
        return this.operator.hasPerms('motions.can_manage_polls');
    }
}
