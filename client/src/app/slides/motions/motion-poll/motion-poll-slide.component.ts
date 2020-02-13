import { Component } from '@angular/core';

import { PollState } from 'app/shared/models/poll/base-poll';
import { PollService } from 'app/site/polls/services/poll.service';
import { BasePollSlideComponent } from 'app/slides/polls/base-poll-slide.component';
import { MotionPollSlideData } from './motion-poll-slide-data';

@Component({
    selector: 'os-motion-poll-slide',
    templateUrl: './motion-poll-slide.component.html',
    styleUrls: ['./motion-poll-slide.component.scss']
})
export class MotionPollSlideComponent extends BasePollSlideComponent<MotionPollSlideData> {
    public PollState = PollState;

    public voteYes: number;
    public voteNo: number;
    public voteAbstain: number;

    public constructor(pollService: PollService) {
        super(pollService);
        this.chartDataSubject.subscribe(() => {
            if (this.data && this.data.data) {
                const result = this.data.data.poll.options[0];
                this.voteYes = result.yes;
                this.voteNo = result.no;
                this.voteAbstain = result.abstain;
            }
        });
    }
}
