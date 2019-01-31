import { Injectable } from '@angular/core';

import { DataStoreService } from '../../core-services/data-store.service';
import { BaseRepository } from '../base-repository';
import { CollectionStringMapperService } from '../../core-services/collectionStringMapper.service';
import { PersonalNote } from 'app/shared/models/users/personal-note';
import { Identifiable } from 'app/shared/models/base/identifiable';

/**
 */
@Injectable({
    providedIn: 'root'
})
export class PersonalNoteRepositoryService extends BaseRepository<any, PersonalNote> {
    /**
     * @param DS The DataStore
     * @param mapperService Maps collection strings to classes
     */
    public constructor(protected DS: DataStoreService, mapperService: CollectionStringMapperService) {
        super(DS, mapperService, PersonalNote);
    }

    protected createViewModel(personalNote: PersonalNote): any {
        return {};
    }

    public async create(personalNote: PersonalNote): Promise<Identifiable> {
        throw new Error('TODO');
    }

    public async update(personalNote: Partial<PersonalNote>, viewPersonalNote: any): Promise<void> {
        throw new Error('TODO');
    }

    public async delete(viewPersonalNote: any): Promise<void> {
        throw new Error('TODO');
    }
}
