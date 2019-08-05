import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { RelationManagerService } from 'app/core/core-services/relation-manager.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { StatuteParagraph } from 'app/shared/models/motions/statute-paragraph';
import { StatuteParagraphTitleInformation, ViewStatuteParagraph } from 'app/site/motions/models/view-statute-paragraph';
import { BaseRepository } from '../base-repository';
import { CollectionStringMapperService } from '../../core-services/collection-string-mapper.service';
import { DataSendService } from '../../core-services/data-send.service';
import { DataStoreService } from '../../core-services/data-store.service';

/**
 * Repository Services for statute paragraphs
 *
 * Rather than manipulating models directly, the repository is meant to
 * inform the {@link DataSendService} about changes which will send
 * them to the Server.
 */
@Injectable({
    providedIn: 'root'
})
export class StatuteParagraphRepositoryService extends BaseRepository<
    ViewStatuteParagraph,
    StatuteParagraph,
    StatuteParagraphTitleInformation
> {
    /**
     * Creates a StatuteParagraphRepository
     * Converts existing and incoming statute paragraphs to ViewStatuteParagraphs
     * Handles CRUD using an observer to the DataStore
     *
     * @param DS The DataStore
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
        super(DS, dataSend, mapperService, viewModelStoreService, translate, relationManager, StatuteParagraph);
    }

    public getTitle = (titleInformation: StatuteParagraphTitleInformation) => {
        return titleInformation.title;
    };

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Statute paragraphs' : 'Statute paragraph');
    };
}
