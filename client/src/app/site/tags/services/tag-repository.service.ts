import { Injectable } from '@angular/core';
import { Tag } from '../../../shared/models/core/tag';
import { ViewTag } from '../models/view-tag';
import { DataSendService } from '../../../core/services/data-send.service';
import { Observable } from 'rxjs';
import { DataStoreService } from '../../../core/services/data-store.service';
import { BaseRepository } from '../../base/base-repository';
import { HTTPMethod } from 'app/core/services/http.service';

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
    public constructor(protected DS: DataStoreService, private dataSend: DataSendService) {
        super(DS, Tag);
    }

    protected createViewModel(tag: Tag): ViewTag {
        return new ViewTag(tag);
    }

    public create(update: Tag): Observable<any> {
        const newTag = new Tag();
        newTag.patchValues(update);
        return this.dataSend.createModel(newTag);
    }

    public update(update: Partial<Tag>, viewTag: ViewTag): Observable<any> {
        const updateTag = new Tag();
        updateTag.patchValues(viewTag.tag);
        updateTag.patchValues(update);
        return this.dataSend.updateModel(updateTag, HTTPMethod.PUT);
    }

    public delete(viewTag: ViewTag): Observable<any> {
        return this.dataSend.deleteModel(viewTag.tag);
    }
}
