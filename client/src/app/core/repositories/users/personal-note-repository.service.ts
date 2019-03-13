import { Injectable } from '@angular/core';

import { DataStoreService } from '../../core-services/data-store.service';
import { BaseRepository } from '../base-repository';
import { CollectionStringMapperService } from '../../core-services/collectionStringMapper.service';
import { PersonalNote } from 'app/shared/models/users/personal-note';
import { ViewPersonalNote } from 'app/site/users/models/view-personal-note';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { TranslateService } from '@ngx-translate/core';
import { DataSendService } from 'app/core/core-services/data-send.service';

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
        dataSend: DataSendService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        private translate: TranslateService
    ) {
        super(DS, dataSend, mapperService, viewModelStoreService, PersonalNote);
    }

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Personal notes' : 'Personal note');
    };

    protected createViewModel(personalNote: PersonalNote): ViewPersonalNote {
        const viewPersonalNote = new ViewPersonalNote(personalNote);
        viewPersonalNote.getVerboseName = this.getVerboseName;
        return viewPersonalNote;
    }
}
