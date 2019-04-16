import { Injectable } from '@angular/core';

import { BaseFilterListService, OsFilter } from 'app/core/ui-services/base-filter-list.service';
import { ViewMediafile } from '../models/view-mediafile';
import { StorageService } from 'app/core/core-services/storage.service';
import { MediafileRepositoryService } from 'app/core/repositories/mediafiles/mediafile-repository.service';
import { OperatorService } from 'app/core/core-services/operator.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
    providedIn: 'root'
})
export class MediafileFilterListService extends BaseFilterListService<ViewMediafile> {
    protected name = 'Mediafile';

    /**
     * A filter checking if a file is a pdf or not
     */
    public pdfOption: OsFilter = {
        property: 'type',
        label: 'PDF',
        options: [
            {
                condition: 'application/pdf',
                label: this.translate.instant('Is PDF file')
            },
            {
                condition: null,
                label: this.translate.instant('Is no PDF file')
            }
        ]
    };

    /**
     * A filter checking if a file is hidden. Only included if the operator has permission to see hidden files
     */
    public hiddenOptions: OsFilter = {
        property: 'is_hidden',
        label: this.translate.instant('Visibility'),
        options: [
            { condition: true, label: this.translate.instant('is hidden') },
            { condition: false, label: this.translate.instant('is not hidden') }
        ]
    };

    /**
     * Constructor. Sets the filter options according to permissions
     * @param store
     * @param repo
     * @param operator
     * @param translate
     */
    public constructor(
        store: StorageService,
        repo: MediafileRepositoryService,
        operator: OperatorService,
        private translate: TranslateService
    ) {
        super(store, repo);
        const filterOptions = operator.hasPerms('mediafiles.can_see_hidden')
            ? [this.hiddenOptions, this.pdfOption]
            : [this.pdfOption];
        this.updateFilterDefinitions(filterOptions);
    }
}
