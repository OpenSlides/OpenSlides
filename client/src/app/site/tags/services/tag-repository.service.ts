import { Injectable } from '@angular/core';
import { Tag } from '../../../shared/models/core/tag';
import { ViewTag } from '../models/view-tag';
import { DataSendService } from '../../../core/services/data-send.service';
import { DataStoreService } from '../../../core/services/data-store.service';
import { BaseRepository } from '../../base/base-repository';
import { Identifiable } from '../../../shared/models/base/identifiable';
import { CollectionStringModelMapperService } from '../../../core/services/collectionStringModelMapper.service';

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
export class TagRepositoryService extends BaseRepository<ViewTag, Tag> {
    /**
     * Creates a TagRepository
     * Converts existing and incoming Tags to ViewTags
     * Handles CRUD using an observer to the DataStore
     * @param DataSend
     */
    public constructor(
        protected DS: DataStoreService,
        mapperService: CollectionStringModelMapperService,
        private dataSend: DataSendService
    ) {
        super(DS, mapperService, Tag);
    }

    protected createViewModel(tag: Tag): ViewTag {
        return new ViewTag(tag);
    }

    public async create(update: Tag): Promise<Identifiable> {
        const newTag = new Tag();
        newTag.patchValues(update);
        return await this.dataSend.createModel(newTag);
    }

    public async update(update: Partial<Tag>, viewTag: ViewTag): Promise<void> {
        const updateTag = new Tag();
        updateTag.patchValues(viewTag.tag);
        updateTag.patchValues(update);
        await this.dataSend.updateModel(updateTag);
    }

    public async delete(viewTag: ViewTag): Promise<void> {
        await this.dataSend.deleteModel(viewTag.tag);
    }
}
