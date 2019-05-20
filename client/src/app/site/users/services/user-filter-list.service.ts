import { Injectable } from '@angular/core';

import { BaseFilterListService, OsFilter } from 'app/core/ui-services/base-filter-list.service';
import { GroupRepositoryService } from 'app/core/repositories/users/group-repository.service';
import { StorageService } from 'app/core/core-services/storage.service';
import { TranslateService } from '@ngx-translate/core';
import { ViewUser } from '../models/view-user';

/**
 * Filter the user list
 */
@Injectable({
    providedIn: 'root'
})
export class UserFilterListService extends BaseFilterListService<ViewUser> {
    private userGroupFilterOptions: OsFilter = {
        property: 'groups_id',
        label: 'Groups',
        options: []
    };

    /**
     * Constructor.
     * Subscribes to incoming group definitions.
     *
     * @param store
     * @param groupRepo to filter by groups
     * @param translate marking some translations that are unique here
     */
    public constructor(store: StorageService, groupRepo: GroupRepositoryService, private translate: TranslateService) {
        super('User', store);
        this.updateFilterForRepo(groupRepo, this.userGroupFilterOptions, this.translate.instant('Default'), [1]);
    }

    /**
     * @returns the filter definition
     */
    protected getFilterDefinitions(): OsFilter[] {
        const staticFilterOptions: OsFilter[] = [
            {
                property: 'is_present',
                label: 'Presence',
                options: [
                    { condition: true, label: this.translate.instant('Is present') },
                    { condition: false, label: this.translate.instant('Is not present') }
                ]
            },
            {
                property: 'is_active',
                label: this.translate.instant('Active'),
                options: [
                    { condition: true, label: 'Is active' },
                    { condition: false, label: this.translate.instant('Is not active') }
                ]
            },
            {
                property: 'is_committee',
                label: this.translate.instant('Committee'),
                options: [
                    { condition: true, label: 'Is a committee' },
                    { condition: false, label: this.translate.instant('Is not a committee') }
                ]
            },
            {
                property: 'is_last_email_send',
                label: this.translate.instant('Last email send'),
                options: [
                    { condition: true, label: this.translate.instant('Got an email') },
                    { condition: false, label: this.translate.instant("Didn't get an email") }
                ]
            }
        ];
        return staticFilterOptions.concat(this.userGroupFilterOptions);
    }
}
