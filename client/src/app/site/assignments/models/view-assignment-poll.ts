import { marker as _ } from '@biesbjerg/ngx-translate-extract-marker';
import { BehaviorSubject } from 'rxjs';

import { ChartData } from 'app/shared/components/charts/charts.component';
import {
    AssignmentPoll,
    AssignmentPollMethod,
    AssignmentPollPercentBase
} from 'app/shared/models/assignments/assignment-poll';
import { BaseViewModel } from 'app/site/base/base-view-model';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { PollClassType, ViewBasePoll } from 'app/site/polls/models/view-base-poll';
import { ViewAssignment } from './view-assignment';
import { ViewAssignmentOption } from './view-assignment-option';

export interface AssignmentPollTitleInformation {
    title: string;
}

export const AssignmentPollMethodVerbose = {
    Y: _('Yes per candidate'),
    N: _('No per candidate'),
    YN: _('Yes/No per candidate'),
    YNA: _('Yes/No/Abstain per candidate')
};

export const AssignmentPollPercentBaseVerbose = {
    Y: _('Sum of votes including general No/Abstain'),
    YN: _('Yes/No per candidate'),
    YNA: _('Yes/No/Abstain per candidate'),
    valid: _('All valid ballots'),
    cast: _('All casted ballots'),
    entitled: _('All entitled users'),
    disabled: _('Disabled (no percents)')
};

export class ViewAssignmentPoll
    extends ViewBasePoll<AssignmentPoll, AssignmentPollMethod, AssignmentPollPercentBase>
    implements AssignmentPollTitleInformation {
    public static COLLECTIONSTRING = AssignmentPoll.COLLECTIONSTRING;
    protected _collectionString = AssignmentPoll.COLLECTIONSTRING;

    public readonly tableChartData: Map<string, BehaviorSubject<ChartData>> = new Map();
    public readonly pollClassType = PollClassType.Assignment;

    public get pollmethodVerbose(): string {
        return AssignmentPollMethodVerbose[this.pollmethod];
    }

    public get percentBaseVerbose(): string {
        return AssignmentPollPercentBaseVerbose[this.onehundred_percent_base];
    }

    public getContentObject(): BaseViewModel {
        return this.assignment;
    }

    public getSlide(): ProjectorElementBuildDeskriptor {
        return {
            getBasicProjectorElement: options => ({
                name: AssignmentPoll.COLLECTIONSTRING,
                id: this.id,
                getIdentifiers: () => ['name', 'id']
            }),
            slideOptions: [],
            projectionDefaultName: 'assignment_poll',
            getDialogTitle: this.getTitle
        };
    }

    protected getDecimalFields(): string[] {
        return AssignmentPoll.DECIMAL_FIELDS;
    }
}

export interface ViewAssignmentPoll extends AssignmentPoll {
    options: ViewAssignmentOption[];
    assignment: ViewAssignment;
}
