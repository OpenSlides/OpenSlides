import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { OpenSlidesStatusService } from 'app/core/core-services/openslides-status.service';
import { StorageService } from 'app/core/core-services/storage.service';
import { BaseFilterListService, OsFilter } from 'app/core/ui-services/base-filter-list.service';
import { PollState } from 'app/shared/models/poll/base-poll';
import { ViewBasePoll } from '../models/view-base-poll';

@Injectable({
    providedIn: 'root'
})
export class PollFilterListService extends BaseFilterListService<ViewBasePoll> {
    /**
     * set the storage key name
     */
    protected storageKey = 'PollList';

    public constructor(store: StorageService, OSStatus: OpenSlidesStatusService, private translate: TranslateService) {
        super(store, OSStatus);
    }

    /**
     * Filter out analog polls
     * @param viewPoll All polls
     */
    protected preFilter(viewPoll: ViewBasePoll[]): ViewBasePoll[] | void {
        return viewPoll.filter(poll => !poll.isAnalog);
    }

    /**
     * @returns the filter definition
     */
    protected getFilterDefinitions(): OsFilter[] {
        return [
            {
                property: 'state',
                label: this.translate.instant('State'),
                options: [
                    { condition: PollState.Created, label: this.translate.instant('created') },
                    { condition: PollState.Started, label: this.translate.instant('started') },
                    { condition: PollState.Finished, label: this.translate.instant('finished (unpublished)') },
                    { condition: PollState.Published, label: this.translate.instant('published') }
                ]
            },
            {
                property: 'hasVote',
                label: this.translate.instant('Votings'),
                options: [
                    { condition: false, label: this.translate.instant('Voting is currently in progress.') },
                    { condition: true, label: this.translate.instant('You have already voted.') }
                ]
            }
        ];
    }
}
