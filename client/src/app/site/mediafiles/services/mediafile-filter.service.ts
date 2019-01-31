import { Injectable } from '@angular/core';

import { FilterListService, OsFilter } from '../../../core/services/filter-list.service';
import { Mediafile } from '../../../shared/models/mediafiles/mediafile';
import { ViewMediafile } from '../models/view-mediafile';
import { StorageService } from 'app/core/services/storage.service';
import { MediafileRepositoryService } from './mediafile-repository.service';

@Injectable({
    providedIn: 'root'
})
export class MediafileFilterListService extends FilterListService<Mediafile, ViewMediafile> {
    protected name = 'Mediafile';

    public filterOptions: OsFilter[] = [
        {
            property: 'is_hidden',
            label: 'Hidden',
            options: [
                { condition: true, label: 'is hidden' },
                { condition: false, label: 'is not hidden', isActive: true }
            ]
        },
        {
            property: 'fileType',
            label: 'Is PDF',
            options: [
                {
                    condition: 'application/pdf',
                    label: 'Is PDF file'
                },
                {
                    condition: null,
                    label: 'Is no PDF file'
                }
            ]
        }
    ];

    public constructor(store: StorageService, repo: MediafileRepositoryService) {
        super(store, repo);
        this.updateFilterDefinitions(this.filterOptions);
    }
}
