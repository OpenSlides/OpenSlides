import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { ConstantsService } from 'app/core/core-services/constants.service';
import { AssignmentPollRepositoryService } from 'app/core/repositories/assignments/assignment-poll-repository.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import {
    AssignmentPoll,
    AssignmentPollMethod,
    AssignmentPollPercentBase
} from 'app/shared/models/assignments/assignment-poll';
import { MajorityMethod } from 'app/shared/models/poll/base-poll';
import { PollData, PollService, PollTableData, VotingResult } from 'app/site/polls/services/poll.service';
import { ViewAssignmentPoll } from '../models/view-assignment-poll';

@Injectable({
    providedIn: 'root'
})
export class AssignmentPollService extends PollService {
    /**
     * The default percentage base
     */
    public defaultPercentBase: AssignmentPollPercentBase;

    /**
     * The default majority method
     */
    public defaultMajorityMethod: MajorityMethod;

    public defaultGroupIds: number[];

    public defaultPollMethod: AssignmentPollMethod;

    private sortByVote: boolean;

    /**
     * Constructor. Subscribes to the configuration values needed
     * @param config ConfigService
     */
    public constructor(
        config: ConfigService,
        constants: ConstantsService,
        private translate: TranslateService,
        private pollRepo: AssignmentPollRepositoryService
    ) {
        super(constants);
        config
            .get<AssignmentPollPercentBase>('assignment_poll_default_100_percent_base')
            .subscribe(base => (this.defaultPercentBase = base));
        config
            .get<MajorityMethod>('assignment_poll_default_majority_method')
            .subscribe(method => (this.defaultMajorityMethod = method));
        config.get<number[]>(AssignmentPoll.defaultGroupsConfig).subscribe(ids => (this.defaultGroupIds = ids));
        config
            .get<AssignmentPollMethod>(AssignmentPoll.defaultPollMethodConfig)
            .subscribe(method => (this.defaultPollMethod = method));
        config.get<boolean>('assignment_poll_sort_poll_result_by_votes').subscribe(sort => (this.sortByVote = sort));
    }

    public getDefaultPollData(contextId?: number): AssignmentPoll {
        const poll = new AssignmentPoll({
            ...super.getDefaultPollData()
        });

        poll.title = this.translate.instant('Ballot');
        poll.pollmethod = this.defaultPollMethod;

        if (contextId) {
            const length = this.pollRepo.getViewModelList().filter(item => item.assignment_id === contextId).length;
            if (length) {
                poll.title += ` (${length + 1})`;
            }
        }

        return poll;
    }

    private getGlobalVoteKeys(poll: ViewAssignmentPoll): VotingResult[] {
        // debugger;
        return [
            {
                vote: 'amount_global_no',
                showPercent: this.showPercentOfValidOrCast(poll),
                hide: poll.amount_global_no === -2 || !poll.amount_global_no
            },
            {
                vote: 'amount_global_abstain',
                showPercent: this.showPercentOfValidOrCast(poll),
                hide: poll.amount_global_abstain === -2 || !poll.amount_global_abstain
            }
        ];
    }

    public generateTableData(poll: ViewAssignmentPoll): PollTableData[] {
        const tableData: PollTableData[] = poll.options
            .sort((a, b) => {
                if (this.sortByVote) {
                    return b.yes - a.yes;
                } else {
                    return b.weight - a.weight;
                }
            })
            .map(candidate => ({
                votingOption: candidate.user.short_name,
                votingOptionSubtitle: candidate.user.getLevelAndNumber(),
                class: 'user',
                value: super.getVoteTableKeys(poll).map(
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
        tableData.push(...this.formatVotingResultToTableData(this.getGlobalVoteKeys(poll), poll));
        tableData.push(...this.formatVotingResultToTableData(super.getSumTableKeys(poll), poll));
        return tableData;
    }

    private formatVotingResultToTableData(resultList: VotingResult[], poll: PollData): PollTableData[] {
        return resultList
            .filter(key => {
                return !key.hide;
            })
            .map(key => ({
                votingOption: key.vote,
                class: 'sums',
                value: [
                    {
                        amount: poll[key.vote],
                        hide: key.hide,
                        showPercent: key.showPercent
                    } as VotingResult
                ]
            }));
    }

    private sumOptionsYN(poll: PollData): number {
        return poll.options.reduce((o, n) => {
            o += n.yes > 0 ? n.yes : 0;
            o += n.no > 0 ? n.no : 0;
            return o;
        }, 0);
    }

    private sumOptionsYNA(poll: PollData): number {
        return poll.options.reduce((o, n) => {
            o += n.abstain > 0 ? n.abstain : 0;
            return o;
        }, this.sumOptionsYN(poll));
    }

    public getPercentBase(poll: PollData): number {
        const base: AssignmentPollPercentBase = poll.onehundred_percent_base as AssignmentPollPercentBase;
        let totalByBase: number;
        switch (base) {
            case AssignmentPollPercentBase.YN:
                totalByBase = this.sumOptionsYN(poll);
                break;
            case AssignmentPollPercentBase.YNA:
                totalByBase = this.sumOptionsYNA(poll);
                break;
            case AssignmentPollPercentBase.Votes:
                totalByBase = this.sumOptionsYNA(poll);
                break;
            case AssignmentPollPercentBase.Valid:
                totalByBase = poll.votesvalid;
                break;
            case AssignmentPollPercentBase.Cast:
                totalByBase = poll.votescast;
                break;
            default:
                break;
        }
        return totalByBase;
    }
}
