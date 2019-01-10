import { Injectable } from '@angular/core';

import { FilterListService } from '../../../core/services/filter-list.service';
import { Mediafile } from '../../../shared/models/mediafiles/mediafile';
import { ViewMediafile } from '../models/view-mediafile';
import { StorageService } from 'app/core/services/storage.service';
import { MediafileRepositoryService } from './mediafile-repository.service';

@Injectable({
    providedIn: 'root'
})
export class MediafileFilterListService extends FilterListService<Mediafile, ViewMediafile> {
    protected name = 'Mediafile';

    public filterOptions = [
        {
            property: 'is_hidden',
            label: 'Hidden',
            options: [
                { condition: true, label: 'is hidden' },
                { condition: false, label: 'is not hidden', isActive: true }
            ]
        }
        // , { TODO: is_pdf is not yet implemented on mediafile side
        //     property: 'is_pdf', isActive: false, label: 'PDF',
        //     options: [
        //         {condition: true, label: 'is a PDF'},
        //         {condition: false, label: 'is not a PDF'}
        //     ]
        // }
    ];

    public constructor(store: StorageService, repo: MediafileRepositoryService) {
        super(store, repo);
    }
}
