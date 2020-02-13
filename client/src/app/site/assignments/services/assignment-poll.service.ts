import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { ConstantsService } from 'app/core/core-services/constants.service';
import { AssignmentPollRepositoryService } from 'app/core/repositories/assignments/assignment-poll-repository.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { AssignmentPollMethods } from 'app/shared/models/assignments/assignment-poll';
import { Collection } from 'app/shared/models/base/collection';
import { MajorityMethod, PercentBase } from 'app/shared/models/poll/base-poll';
import { PollData, PollService } from 'app/site/polls/services/poll.service';
import { ViewAssignmentPoll } from '../models/view-assignment-poll';

@Injectable({
    providedIn: 'root'
})
export class AssignmentPollService extends PollService {
    /**
     * The default percentage base
     */
    public defaultPercentBase: PercentBase;

    /**
     * The default majority method
     */
    public defaultMajorityMethod: MajorityMethod;

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
            .get<PercentBase>('motion_poll_default_100_percent_base')
            .subscribe(base => (this.defaultPercentBase = base));
        config
            .get<MajorityMethod>('motion_poll_default_majority_method')
            .subscribe(method => (this.defaultMajorityMethod = method));
    }

    public fillDefaultPollData(poll: Partial<ViewAssignmentPoll> & Collection): void {
        super.fillDefaultPollData(poll);
        const length = this.pollRepo.getViewModelList().filter(item => item.assignment_id === poll.assignment_id)
            .length;

        poll.title = !length ? this.translate.instant('Ballot') : `${this.translate.instant('Ballot')} (${length + 1})`;
        poll.pollmethod = AssignmentPollMethods.YN;
        poll.assignment_id = poll.assignment_id;
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
        const base: PercentBase = poll.onehundred_percent_base;
        let totalByBase: number;
        switch (base) {
            case PercentBase.YN:
                totalByBase = this.sumOptionsYN(poll);
                break;
            case PercentBase.YNA:
                totalByBase = this.sumOptionsYNA(poll);
                break;
            case PercentBase.Valid:
                totalByBase = poll.votesvalid;
                break;
            case PercentBase.Cast:
                totalByBase = poll.votescast;
                break;
            default:
                break;
        }
        return totalByBase;
    }
}
