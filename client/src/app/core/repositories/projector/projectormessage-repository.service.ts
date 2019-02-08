import { Injectable } from '@angular/core';
import { DataStoreService } from '../../core-services/data-store.service';
import { BaseRepository } from '../base-repository';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { CollectionStringMapperService } from '../../core-services/collectionStringMapper.service';
import { ProjectorMessage } from 'app/shared/models/core/projector-message';
import { ViewProjectorMessage } from 'app/site/projector/models/view-projectormessage';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
    providedIn: 'root'
})
export class ProjectorMessageRepositoryService extends BaseRepository<ViewProjectorMessage, ProjectorMessage> {
    public constructor(
        DS: DataStoreService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        private translate: TranslateService
    ) {
        super(DS, mapperService, viewModelStoreService, ProjectorMessage);
    }

    protected createViewModel(message: ProjectorMessage): ViewProjectorMessage {
        const viewProjectorMessage = new ViewProjectorMessage(message);
        viewProjectorMessage.getVerboseName = (plural: boolean = false) => {
            return this.translate.instant(plural ? 'Messages' : 'Message');
        };
        return viewProjectorMessage;
    }

    public async create(message: ProjectorMessage): Promise<Identifiable> {
        throw new Error('TODO');
    }

    public async update(message: Partial<ProjectorMessage>, viewMessage: ViewProjectorMessage): Promise<void> {
        throw new Error('TODO');
    }

    public async delete(viewMessage: ViewProjectorMessage): Promise<void> {
        throw new Error('TODO');
    }
}
