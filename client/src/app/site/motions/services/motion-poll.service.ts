import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { ConstantsService } from 'app/core/core-services/constants.service';
import { MotionPollRepositoryService } from 'app/core/repositories/motions/motion-poll-repository.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { MotionPoll, MotionPollMethod } from 'app/shared/models/motions/motion-poll';
import { MajorityMethod, PercentBase, PollType } from 'app/shared/models/poll/base-poll';
import { ParsePollNumberPipe } from 'app/shared/pipes/parse-poll-number.pipe';
import { PollKeyVerbosePipe } from 'app/shared/pipes/poll-key-verbose.pipe';
import { PollData, PollService, PollTableData, VotingResult } from 'app/site/polls/services/poll.service';
import { ViewMotionOption } from '../models/view-motion-option';
import { ViewMotionPoll } from '../models/view-motion-poll';

interface PollResultData {
    yes?: number;
    no?: number;
    abstain?: number;
}

/**
 * Service class for motion polls.
 */
@Injectable({
    providedIn: 'root'
})
export class MotionPollService extends PollService {
    /**
     * The default percentage base
     */
    public defaultPercentBase: PercentBase;

    /**
     * The default majority method
     */
    public defaultMajorityMethod: MajorityMethod;

    public defaultGroupIds: number[];

    public defaultPollType: PollType;

    /**
     * Constructor. Subscribes to the configuration values needed
     * @param config ConfigService
     */
    public constructor(
        config: ConfigService,
        constants: ConstantsService,
        pollKeyVerbose: PollKeyVerbosePipe,
        parsePollNumber: ParsePollNumberPipe,
        protected translate: TranslateService,
        private pollRepo: MotionPollRepositoryService
    ) {
        super(constants, translate, pollKeyVerbose, parsePollNumber);
        config
            .get<PercentBase>('motion_poll_default_100_percent_base')
            .subscribe(base => (this.defaultPercentBase = base));
        config
            .get<MajorityMethod>('motion_poll_default_majority_method')
            .subscribe(method => (this.defaultMajorityMethod = method));
        config.get<PollType>('motion_poll_default_type').subscribe(type => (this.defaultPollType = type));

        config.get<number[]>(MotionPoll.defaultGroupsConfig).subscribe(ids => (this.defaultGroupIds = ids));
    }

    public getDefaultPollData(contextId?: number): MotionPoll {
        const poll = new MotionPoll(super.getDefaultPollData());

        poll.title = this.translate.instant('Vote');
        poll.pollmethod = MotionPollMethod.YNA;

        if (contextId) {
            const length = this.pollRepo.getViewModelList().filter(item => item.motion_id === contextId).length;
            if (length) {
                poll.title += ` (${length + 1})`;
            }
        }

        return poll;
    }

    public generateTableData(poll: PollData | ViewMotionPoll): PollTableData[] {
        let tableData: PollTableData[] = poll.options.flatMap(vote =>
            super.getVoteTableKeys(poll).map(key => this.createTableDataEntry(poll, key, vote))
        );
        tableData.push(...super.getSumTableKeys(poll).map(key => this.createTableDataEntry(poll, key)));

        tableData = tableData.filter(localeTableData => !localeTableData.value.some(result => result.hide));
        return tableData;
    }

    private createTableDataEntry(
        poll: PollData | ViewMotionPoll,
        result: VotingResult,
        vote?: ViewMotionOption
    ): PollTableData {
        return {
            votingOption: result.vote,
            value: [
                {
                    amount: vote ? vote[result.vote] : poll[result.vote],
                    hide: result.hide,
                    icon: result.icon,
                    showPercent: result.showPercent
                }
            ]
        };
    }

    public showChart(poll: PollData): boolean {
        return poll && poll.options && poll.options.some(option => option.yes >= 0 && option.no >= 0);
    }

    public getPercentBase(poll: PollData): number {
        const base: PercentBase = poll.onehundred_percent_base as PercentBase;

        let totalByBase: number;
        const result = poll.options[0];
        switch (base) {
            case PercentBase.YN:
                if (result.yes >= 0 && result.no >= 0) {
                    totalByBase = this.sumYN(result);
                }
                break;
            case PercentBase.YNA:
                if (result.yes >= 0 && result.no >= 0 && result.abstain >= 0) {
                    totalByBase = this.sumYNA(result);
                }
                break;
            case PercentBase.Valid:
                // auslagern
                if (result.yes >= 0 && result.no >= 0 && result.abstain >= 0) {
                    totalByBase = poll.votesvalid;
                }
                break;
            case PercentBase.Cast:
                totalByBase = poll.votescast;
                break;
            case PercentBase.Entitled:
                totalByBase = poll.entitled_users_at_stop.length;
                break;
            case PercentBase.Disabled:
                break;
            default:
                throw new Error('The given poll has no percent base: ' + this);
        }

        return totalByBase;
    }

    private sumYN(result: PollResultData): number {
        let sum = 0;
        sum += result.yes > 0 ? result.yes : 0;
        sum += result.no > 0 ? result.no : 0;
        return sum;
    }

    private sumYNA(result: PollResultData): number {
        let sum = this.sumYN(result);
        sum += result.abstain > 0 ? result.abstain : 0;
        return sum;
    }
}
