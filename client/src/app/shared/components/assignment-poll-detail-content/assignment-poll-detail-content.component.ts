import { Component, Input } from '@angular/core';

import { AssignmentPollMethod } from 'app/shared/models/assignments/assignment-poll';
import { ViewAssignmentPoll } from 'app/site/assignments/models/view-assignment-poll';
import { AssignmentPollService } from 'app/site/assignments/modules/assignment-poll/services/assignment-poll.service';
import { PollData, PollTableData, VotingResult } from 'app/site/polls/services/poll.service';

@Component({
    selector: 'os-assignment-poll-detail-content',
    templateUrl: './assignment-poll-detail-content.component.html',
    styleUrls: ['./assignment-poll-detail-content.component.scss']
})
export class AssignmentPollDetailContentComponent {
    @Input()
    public poll: ViewAssignmentPoll | PollData;

    public constructor(private pollService: AssignmentPollService) {}

    private get method(): string {
        return this.poll.pollmethod;
    }

    public get isMethodY(): boolean {
        return this.method === AssignmentPollMethod.Votes;
    }

    public get isMethodYN(): boolean {
        return this.method === AssignmentPollMethod.YN;
    }

    public get isMethodYNA(): boolean {
        return this.method === AssignmentPollMethod.YNA;
    }

    public get tableData(): PollTableData[] {
        return this.pollService.generateTableData(this.poll);
    }

    public getVoteClass(votingResult: VotingResult): string {
        return votingResult.vote;
    }

    public voteFitsMethod(result: VotingResult): boolean {
        if (this.isMethodY) {
            if (result.vote === 'abstain' || result.vote === 'no') {
                return false;
            }
        } else if (this.isMethodYN) {
            if (result.vote === 'abstain') {
                return false;
            }
        }
        return true;
    }
}
