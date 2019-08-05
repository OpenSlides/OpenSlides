import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { RelationManagerService } from 'app/core/core-services/relation-manager.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { Tag } from 'app/shared/models/core/tag';
import { TagTitleInformation, ViewTag } from 'app/site/tags/models/view-tag';
import { BaseRepository } from '../base-repository';
import { CollectionStringMapperService } from '../../core-services/collection-string-mapper.service';
import { DataSendService } from '../../core-services/data-send.service';
import { DataStoreService } from '../../core-services/data-store.service';

/**
 * Repository Services for Tags
 *
 * The repository is meant to process domain objects (those found under
 * shared/models), so components can display them and interact with them.
 *
 * Rather than manipulating models directly, the repository is meant to
 * inform the {@link DataSendService} about changes which will send
 * them to the Server.
 */
@Injectable({
    providedIn: 'root'
})
export class TagRepositoryService extends BaseRepository<ViewTag, Tag, TagTitleInformation> {
    /**
     * Creates a TagRepository
     * Converts existing and incoming Tags to ViewTags
     * Handles CRUD using an observer to the DataStore
     *
     * @param DS DataStore
     * @param mapperService Maps collection strings to classes
     * @param dataSend sending changed objects
     */
    public constructor(
        DS: DataStoreService,
        dataSend: DataSendService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        translate: TranslateService,
        relationManager: RelationManagerService
    ) {
        super(DS, dataSend, mapperService, viewModelStoreService, translate, relationManager, Tag);
        this.initSorting();
    }

    public getTitle = (titleInformation: TagTitleInformation) => {
        return titleInformation.name;
    };

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Tags' : 'Tag');
    };

    /**
     * Sets the default sorting (e.g. in dropdowns and for new users) to 'name'
     */
    private initSorting(): void {
        this.setSortFunction((a: ViewTag, b: ViewTag) => {
            return this.languageCollator.compare(a.name, b.name);
        });
    }
}
