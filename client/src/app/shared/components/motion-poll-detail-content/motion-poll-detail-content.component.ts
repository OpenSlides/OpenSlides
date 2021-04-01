import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { BaseComponent } from 'app/base.component';
import { OperatorService } from 'app/core/core-services/operator.service';
import { PercentBase, PollState } from 'app/shared/models/poll/base-poll';
import { ViewMotionPoll } from 'app/site/motions/models/view-motion-poll';
import { MotionPollService } from 'app/site/motions/services/motion-poll.service';
import { PollData, PollTableData } from 'app/site/polls/services/poll.service';
import { ChartData } from '../charts/charts.component';

@Component({
    selector: 'os-motion-poll-detail-content',
    templateUrl: './motion-poll-detail-content.component.html',
    styleUrls: ['./motion-poll-detail-content.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MotionPollDetailContentComponent extends BaseComponent {
    private _poll: ViewMotionPoll | PollData;

    public chartData: ChartData;
    public tableData: PollTableData[];

    @Input()
    public set poll(pollData: ViewMotionPoll | PollData) {
        this._poll = pollData;
        this.setTableData();
        this.setChartData();
        this.cd.markForCheck();
    }

    public get poll(): ViewMotionPoll | PollData {
        return this._poll;
    }

    @Input()
    public iconSize: 'large' | 'gigantic' = 'large';

    private get state(): PollState {
        return this.poll.state;
    }

    public get hasResults(): boolean {
        return this.isFinished || this.isPublished;
    }

    public get isFinished(): boolean {
        return this.state === PollState.Finished;
    }

    public get isPublished(): boolean {
        return this.state === PollState.Published;
    }

    public get canSeeResults(): boolean {
        return this.operator.hasPerms(this.permission.motionsCanManagePolls) || this.isPublished;
    }

    public get isPercentBaseEntitled(): boolean {
        return this.poll.onehundred_percent_base === PercentBase.Entitled;
    }

    public constructor(
        titleService: Title,
        translate: TranslateService,
        private pollService: MotionPollService,
        private cd: ChangeDetectorRef,
        private operator: OperatorService
    ) {
        super(titleService, translate);
    }

    private setTableData(): void {
        this.tableData = this.pollService.generateTableData(this.poll);
    }

    private setChartData(): void {
        this.chartData = this.pollService.generateChartData(this.poll);
    }
}
