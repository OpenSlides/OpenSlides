import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { ConstantsService } from 'app/core/core-services/constants.service';
import { MotionPollRepositoryService } from 'app/core/repositories/motions/motion-poll-repository.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { Collection } from 'app/shared/models/base/collection';
import { MotionPollMethods } from 'app/shared/models/motions/motion-poll';
import { MajorityMethod, PercentBase } from 'app/shared/models/poll/base-poll';
import { ViewMotionPoll } from 'app/site/motions/models/view-motion-poll';
import { PollService } from 'app/site/polls/services/poll.service';

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
    }

    public fillDefaultPollData(poll: Partial<ViewMotionPoll> & Collection): void {
        super.fillDefaultPollData(poll);
        const length = this.pollRepo.getViewModelList().filter(item => item.motion_id === poll.motion_id).length;

        poll.title = !length ? this.translate.instant('Vote') : `${this.translate.instant('Vote')} (${length + 1})`;
        poll.pollmethod = MotionPollMethods.YNA;
        poll.motion_id = poll.motion_id;
    }
}
