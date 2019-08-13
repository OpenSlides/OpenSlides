import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { DataSendService } from 'app/core/core-services/data-send.service';
import { RelationManagerService } from 'app/core/core-services/relation-manager.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { PersonalNote } from 'app/shared/models/users/personal-note';
import { PersonalNoteTitleInformation, ViewPersonalNote } from 'app/site/users/models/view-personal-note';
import { BaseRepository } from '../base-repository';
import { CollectionStringMapperService } from '../../core-services/collection-string-mapper.service';
import { DataStoreService } from '../../core-services/data-store.service';

/**
 */
@Injectable({
    providedIn: 'root'
})
export class PersonalNoteRepositoryService extends BaseRepository<
    ViewPersonalNote,
    PersonalNote,
    PersonalNoteTitleInformation
> {
    /**
     * @param DS The DataStore
     * @param mapperService Maps collection strings to classes
     */
    public constructor(
        DS: DataStoreService,
        dataSend: DataSendService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        translate: TranslateService,
        relationManager: RelationManagerService
    ) {
        super(DS, dataSend, mapperService, viewModelStoreService, translate, relationManager, PersonalNote);
    }

    public getTitle = (titleInformation: PersonalNoteTitleInformation) => {
        return this.getVerboseName();
    };

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Personal notes' : 'Personal note');
    };

    /**
     * Overwrite the default procedure
     *
     * @ignore
     */
    public async create(): Promise<Identifiable> {
        throw new Error('Not supported');
    }

    /**
     * Overwrite the default procedure
     *
     * @ignore
     */
    public async update(): Promise<void> {
        throw new Error('Not supported');
    }

    /**
     * Overwrite the default procedure
     *
     * @ignore
     */
    public async patch(): Promise<void> {
        throw new Error('Not supported');
    }

    /**
     * Overwrite the default procedure
     *
     * @ignore
     */
    public async delete(): Promise<void> {
        throw new Error('Not supported');
    }
}
