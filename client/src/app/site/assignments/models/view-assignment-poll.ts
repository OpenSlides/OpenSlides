import { BehaviorSubject } from 'rxjs';

import { ChartData } from 'app/shared/components/charts/charts.component';
import { AssignmentPoll } from 'app/shared/models/assignments/assignment-poll';
import { BaseViewModel } from 'app/site/base/base-view-model';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { PollTableData, ViewBasePoll, VotingResult } from 'app/site/polls/models/view-base-poll';
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

    public generateTableData(): PollTableData[] {
        const tableData: PollTableData[] = this.options.map(candidate => ({
            votingOption: candidate.user.short_name,
            votingOptionSubtitle: candidate.user.getLevelAndNumber(),

            value: this.voteTableKeys.map(
                key =>
                    ({
                        vote: key.vote,
                        amount: candidate[key.vote],
                        icon: key.icon,
                        hide: key.hide,
                        showPercent: key.showPercent
                    } as VotingResult)
            )
        }));

        tableData.push(
            ...this.sumTableKeys.map(key => ({
                votingOption: key.vote,
                value: [
                    {
                        amount: this[key.vote],
                        hide: key.hide,
                        showPercent: key.showPercent
                    } as VotingResult
                ]
            }))
        );

        return tableData;
    }
}

export interface ViewAssignmentPoll extends AssignmentPoll {
    options: ViewAssignmentOption[];
    assignment: ViewAssignment;
}
