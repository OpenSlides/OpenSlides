import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { DataStoreService } from '../../core-services/data-store.service';
import { BaseRepository } from '../base-repository';
import { CollectionStringMapperService } from '../../core-services/collection-string-mapper.service';
import { ProjectorMessage } from 'app/shared/models/core/projector-message';
import {
    ViewProjectorMessage,
    ProjectorMessageTitleInformation
} from 'app/site/projector/models/view-projector-message';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { DataSendService } from 'app/core/core-services/data-send.service';

@Injectable({
    providedIn: 'root'
})
export class ProjectorMessageRepositoryService extends BaseRepository<
    ViewProjectorMessage,
    ProjectorMessage,
    ProjectorMessageTitleInformation
> {
    public constructor(
        DS: DataStoreService,
        dataSend: DataSendService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        translate: TranslateService
    ) {
        super(DS, dataSend, mapperService, viewModelStoreService, translate, ProjectorMessage);
    }

    public getTitle = (titleInformation: ProjectorMessageTitleInformation) => {
        return this.getVerboseName();
    };

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Messages' : 'Message');
    };
}
