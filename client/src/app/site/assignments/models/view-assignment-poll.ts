import { BehaviorSubject } from 'rxjs';

import { ChartData } from 'app/shared/components/charts/charts.component';
import { AssignmentPoll, AssignmentPollMethods } from 'app/shared/models/assignments/assignment-poll';
import { PollColor } from 'app/shared/models/poll/base-poll';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { ViewBasePoll } from 'app/site/polls/models/view-base-poll';
import { ViewAssignment } from './view-assignment';
import { ViewAssignmentOption } from './view-assignment-option';

export interface AssignmentPollTitleInformation {
    title: string;
}

export const AssignmentPollMethodsVerbose = {
    votes: 'Fixed Amount of votes for all candidates',
    YN: 'Yes/No per candidate',
    YNA: 'Yes/No/Abstain per candidate'
};

export class ViewAssignmentPoll extends ViewBasePoll<AssignmentPoll> implements AssignmentPollTitleInformation {
    public static COLLECTIONSTRING = AssignmentPoll.COLLECTIONSTRING;
    protected _collectionString = AssignmentPoll.COLLECTIONSTRING;

    public readonly tableChartData: Map<string, BehaviorSubject<ChartData>> = new Map();
    public readonly pollClassType: 'assignment' | 'motion' = 'assignment';

    public get pollmethodVerbose(): string {
        return AssignmentPollMethodsVerbose[this.pollmethod];
    }

    public getSlide(): ProjectorElementBuildDeskriptor {
        // TODO: update to new voting system?
        return {
            getBasicProjectorElement: options => ({
                name: 'assignments/assignment-poll',
                assignment_id: this.assignment_id,
                poll_id: this.id,
                getIdentifiers: () => ['name', 'assignment_id', 'poll_id']
            }),
            slideOptions: [],
            projectionDefaultName: 'assignment-poll',
            getDialogTitle: () => 'TODO'
        };
    }

    public initChartLabels(): string[] {
        return this.options.map(candidate => candidate.user.full_name);
    }

    public generateChartData(): ChartData {
        const fields = ['yes', 'no'];
        if (this.pollmethod === AssignmentPollMethods.YNA) {
            fields.push('abstain');
        }
        const data: ChartData = fields.map(key => ({
            label: key.toUpperCase(),
            data: this.options.map(vote => vote[key]),
            backgroundColor: PollColor[key],
            hoverBackgroundColor: PollColor[key]
        }));
        return data;
    }

    public generateCircleChartData(): ChartData {
        const data: ChartData = this.options.map(candidate => ({
            label: candidate.user.getFullName(),
            data: [candidate.yes]
        }));
        return data;
    }

    public generateTableData(): {}[] {
        const data = this.options
            .map(candidate => ({
                yes: candidate.yes,
                no: candidate.no,
                abstain: candidate.abstain,
                user: candidate.user.full_name
            }))
            .sort((a, b) => b.yes - a.yes);

        return data;
    }
}

export interface ViewAssignmentPoll extends AssignmentPoll {
    options: ViewAssignmentOption[];
    assignment: ViewAssignment;
}
