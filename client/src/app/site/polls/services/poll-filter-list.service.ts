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
                property: 'canBeVotedFor',
                label: this.translate.instant('Vote'),
                options: [
                    { condition: true, label: this.translate.instant('Vote currently possible') },
                    { condition: false, label: this.translate.instant('Vote not possible') }
                ]
            },
            {
                property: 'user_has_voted',
                label: this.translate.instant('Vote finished'),
                options: [
                    { condition: true, label: this.translate.instant('Has been voted for') },
                    { condition: false, label: this.translate.instant('Has not been voted for') }
                ]
            }
        ];
    }
}
