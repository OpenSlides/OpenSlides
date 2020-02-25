import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { ConstantsService } from 'app/core/core-services/constants.service';
import { MotionPollRepositoryService } from 'app/core/repositories/motions/motion-poll-repository.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { MotionPoll, MotionPollMethod } from 'app/shared/models/motions/motion-poll';
import { MajorityMethod, PercentBase } from 'app/shared/models/poll/base-poll';
import { PollData, PollService } from 'app/site/polls/services/poll.service';

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

    /**
     * Constructor. Subscribes to the configuration values needed
     * @param config ConfigService
     */
    public constructor(
        config: ConfigService,
        constants: ConstantsService,
        private translate: TranslateService,
        private pollRepo: MotionPollRepositoryService
    ) {
        super(constants);
        config
            .get<PercentBase>('motion_poll_default_100_percent_base')
            .subscribe(base => (this.defaultPercentBase = base));
        config
            .get<MajorityMethod>('motion_poll_default_majority_method')
            .subscribe(method => (this.defaultMajorityMethod = method));

        config.get<number[]>(MotionPoll.defaultGroupsConfig).subscribe(ids => (this.defaultGroupIds = ids));
    }

    public getDefaultPollData(): MotionPoll {
        const poll = new MotionPoll(super.getDefaultPollData());
        const length = this.pollRepo.getViewModelList().filter(item => item.motion_id === poll.motion_id).length;

        poll.title = !length ? this.translate.instant('Vote') : `${this.translate.instant('Vote')} (${length + 1})`;
        poll.pollmethod = MotionPollMethod.YNA;

        return poll;
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
