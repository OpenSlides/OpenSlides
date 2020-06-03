import { Component, Input, OnInit } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import { ViewMotionPoll } from 'app/site/motions/models/view-motion-poll';
import { MotionPollService } from 'app/site/motions/services/motion-poll.service';
import { PollData, PollTableData } from 'app/site/polls/services/poll.service';
import { ChartData } from '../charts/charts.component';

@Component({
    selector: 'os-motion-poll-detail-content',
    templateUrl: './motion-poll-detail-content.component.html',
    styleUrls: ['./motion-poll-detail-content.component.scss']
})
export class MotionPollDetailContentComponent implements OnInit {
    @Input()
    public poll: ViewMotionPoll | PollData;

    @Input()
    public chartData: BehaviorSubject<ChartData>;

    @Input()
    public iconSize: 'large' | 'gigantic' = 'large';

    public get hasVotes(): boolean {
        return this.poll && !!this.poll.options;
    }

    public constructor(private motionPollService: MotionPollService) {}

    public ngOnInit(): void {}

    public getTableData(): PollTableData[] {
        return this.motionPollService.generateTableData(this.poll);
    }

    public get showChart(): boolean {
        return this.motionPollService.showChart(this.poll) && this.chartData && !!this.chartData.value;
    }
}
