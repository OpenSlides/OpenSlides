import { BehaviorSubject } from 'rxjs';

import { ChartData } from 'app/shared/components/charts/charts.component';
import {
    AssignmentPoll,
    AssignmentPollMethod,
    AssignmentPollPercentBase
} from 'app/shared/models/assignments/assignment-poll';
import { BaseViewModel } from 'app/site/base/base-view-model';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { PollClassType, PollTableData, ViewBasePoll, VotingResult } from 'app/site/polls/models/view-base-poll';
import { ViewAssignment } from './view-assignment';
import { ViewAssignmentOption } from './view-assignment-option';

export interface AssignmentPollTitleInformation {
    title: string;
}

export const AssignmentPollMethodVerbose = {
    votes: 'Yes per candidate',
    YN: 'Yes/No per candidate',
    YNA: 'Yes/No/Abstain per candidate'
};

export const AssignmentPollPercentBaseVerbose = {
    YN: 'Yes/No per candidate',
    YNA: 'Yes/No/Abstain per candidate',
    votes: 'Sum of votes inclusive global ones',
    valid: 'All valid ballots',
    cast: 'All cast ballots',
    disabled: 'Disabled (no percents)'
};

export class ViewAssignmentPoll extends ViewBasePoll<AssignmentPoll, AssignmentPollMethod, AssignmentPollPercentBase>
    implements AssignmentPollTitleInformation {
    public static COLLECTIONSTRING = AssignmentPoll.COLLECTIONSTRING;
    protected _collectionString = AssignmentPoll.COLLECTIONSTRING;

    public readonly tableChartData: Map<string, BehaviorSubject<ChartData>> = new Map();
    public readonly pollClassType = PollClassType.Assignment;

    protected globalVoteKeys: VotingResult[] = [
        {
            vote: 'amount_global_no',
            showPercent: false,
            hide: this.poll.amount_global_no === -2 || this.poll.amount_global_no === 0
        },
        {
            vote: 'amount_global_abstain',
            showPercent: false,
            hide: this.poll.amount_global_abstain === -2 || this.poll.amount_global_abstain === 0
        }
    ];

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

    public generateTableData(): PollTableData[] {
        const tableData: PollTableData[] = this.options.map(candidate => ({
            votingOption: candidate.user.short_name,
            votingOptionSubtitle: candidate.user.getLevelAndNumber(),
            class: 'user',
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
            ...this.sumTableKeys
                .filter(key => {
                    return !key.hide;
                })
                .map(key => ({
                    votingOption: key.vote,
                    class: 'sums',
                    value: [
                        {
                            amount: this[key.vote],
                            hide: key.hide,
                            showPercent: key.showPercent
                        } as VotingResult
                    ]
                }))
        );

        tableData.push(
            ...this.globalVoteKeys
                .filter(key => {
                    return !key.hide;
                })
                .map(key => ({
                    votingOption: key.vote,
                    class: 'sums',
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

    protected getDecimalFields(): string[] {
        return AssignmentPoll.DECIMAL_FIELDS;
    }
}

export interface ViewAssignmentPoll extends AssignmentPoll {
    options: ViewAssignmentOption[];
    assignment: ViewAssignment;
}
