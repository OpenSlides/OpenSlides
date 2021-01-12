import { Component, Input } from '@angular/core';

import { ViewAssignmentOption } from 'app/site/assignments/models/view-assignment-option';
import { ViewAssignmentPoll } from 'app/site/assignments/models/view-assignment-poll';
import { UnknownUserLabel } from 'app/site/assignments/modules/assignment-poll/services/assignment-poll.service';
import { PollPropertyVerbose } from 'app/site/polls/models/view-base-poll';

@Component({
    selector: 'os-assignment-poll-meta-info',
    templateUrl: './assignment-poll-meta-info.component.html',
    styleUrls: ['./assignment-poll-meta-info.component.scss']
})
export class AssignmentPollMetaInfoComponent {
    public pollPropertyVerbose = PollPropertyVerbose;
    private unknownUserLabel = UnknownUserLabel;

    @Input()
    public poll: ViewAssignmentPoll;

    @Input()
    public showCandidates = true;

    public get hasGlobalOption(): boolean {
        return this.poll.hasGlobalOption;
    }

    public constructor() {}

    public userCanVoe(): boolean {
        return this.poll.canBeVotedFor();
    }

    public getOptionTitle(option: ViewAssignmentOption): string {
        return option.user?.getShortName().trim() ?? this.unknownUserLabel;
    }
}
