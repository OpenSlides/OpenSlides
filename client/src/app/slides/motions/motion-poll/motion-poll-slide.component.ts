import { Component } from '@angular/core';

import { MotionPoll } from 'app/shared/models/motions/motion-poll';
import { PollState } from 'app/shared/models/poll/base-poll';
import { MotionPollService } from 'app/site/motions/services/motion-poll.service';
import { PollData, PollTableData } from 'app/site/polls/services/poll.service';
import { BasePollSlideComponentDirective } from 'app/slides/polls/base-poll-slide.component';
import { MotionPollSlideData } from './motion-poll-slide-data';

@Component({
    selector: 'os-motion-poll-slide',
    templateUrl: './motion-poll-slide.component.html',
    styleUrls: ['./motion-poll-slide.component.scss']
})
export class MotionPollSlideComponent extends BasePollSlideComponentDirective<MotionPollSlideData, MotionPollService> {
    public PollState = PollState;

    public pollData: PollData;
    public voteYes: number;
    public voteNo: number;
    public voteAbstain: number;

    public constructor(pollService: MotionPollService) {
        super(pollService);
        this.chartDataSubject.subscribe(() => {
            if (this.data && this.data.data) {
                this.pollData = this.data.data.poll as PollData;
                const result = this.pollData.options[0];
                this.voteYes = result.yes;
                this.voteNo = result.no;
                this.voteAbstain = result.abstain;
            }
        });
    }

    protected getDecimalFields(): string[] {
        return MotionPoll.DECIMAL_FIELDS;
    }

    public showChart(): boolean {
        return this.pollService.showChart(this.pollData);
    }

    public getTableData(): PollTableData[] {
        return this.pollService.generateTableData(this.pollData);
    }
}
