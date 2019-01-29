import { Injectable } from '@angular/core';
import { DataStoreService } from '../../../core/services/data-store.service';
import { BaseRepository } from '../../base/base-repository';
import { Identifiable } from '../../../shared/models/base/identifiable';
import { CollectionStringModelMapperService } from '../../../core/services/collectionStringModelMapper.service';
import { ProjectorMessage } from 'app/shared/models/core/projector-message';
import { ViewProjectorMessage } from '../models/view-projectormessage';

@Injectable({
    providedIn: 'root'
})
export class ProjectorMessageRepositoryService extends BaseRepository<ViewProjectorMessage, ProjectorMessage> {
    public constructor(DS: DataStoreService, mapperService: CollectionStringModelMapperService) {
        super(DS, mapperService, ProjectorMessage);
    }

    protected createViewModel(message: ProjectorMessage): ViewProjectorMessage {
        return new ViewProjectorMessage(message);
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
