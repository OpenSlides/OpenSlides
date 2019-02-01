import { Injectable } from '@angular/core';

import { DataStoreService } from '../../core-services/data-store.service';
import { BaseRepository } from '../base-repository';
import { CollectionStringMapperService } from '../../core-services/collectionStringMapper.service';
import { PersonalNote } from 'app/shared/models/users/personal-note';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { ViewPersonalNote } from 'app/site/users/models/view-personal-note';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';

/**
 */
@Injectable({
    providedIn: 'root'
})
export class PersonalNoteRepositoryService extends BaseRepository<ViewPersonalNote, PersonalNote> {
    /**
     * @param DS The DataStore
     * @param mapperService Maps collection strings to classes
     */
    public constructor(
        DS: DataStoreService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService
    ) {
        super(DS, mapperService, viewModelStoreService, PersonalNote);
    }

    protected createViewModel(personalNote: PersonalNote): ViewPersonalNote {
        return new ViewPersonalNote();
    }

    public async create(personalNote: PersonalNote): Promise<Identifiable> {
        throw new Error('TODO');
    }

    public async update(personalNote: Partial<PersonalNote>, viewPersonalNote: ViewPersonalNote): Promise<void> {
        throw new Error('TODO');
    }

    public async delete(viewPersonalNote: ViewPersonalNote): Promise<void> {
        throw new Error('TODO');
    }
}
