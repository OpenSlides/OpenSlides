import { Injectable } from '@angular/core';

import { BaseRepository } from '../../base/base-repository';
import { ViewMediafile } from '../models/view-mediafile';
import { Mediafile } from '../../../shared/models/mediafiles/mediafile';
import { User } from '../../../shared/models/users/user';
import { Observable } from 'rxjs';
import { DataStoreService } from '../../../core/services/data-store.service';
import { CollectionStringModelMapperService } from '../../../core/services/collectionStringModelMapper.service';
import { TranslateService } from '@ngx-translate/core';
import { PromptService } from '../../../core/services/prompt.service';

/**
 * Repository for files
 */
@Injectable({
    providedIn: 'root'
})
export class MediafileRepositoryService extends BaseRepository<ViewMediafile, Mediafile> {
    /**
     * Consturctor for the file repo
     * @param DS the DataStore
     */
    public constructor(
        DS: DataStoreService,
        mapperService: CollectionStringModelMapperService,
        translate: TranslateService,
        promptService: PromptService
    ) {
        super(DS, mapperService, translate, promptService, Mediafile, [User]);
    }

    /**
     * Saves a config value.
     *
     * TODO: used over not-yet-existing detail view
     */
    public update(file: Partial<Mediafile>, viewFile: ViewMediafile): Observable<Mediafile> {
        return null;
    }

    /**
     * Saves a config value.
     *
     * TODO: used over not-yet-existing detail view
     */
    protected actualDelete(file: ViewMediafile): Observable<void> {
        return null;
    }

    /**
     * Saves a config value.
     *
     * TODO: used over not-yet-existing detail view
     */
    public create(file: Mediafile): Observable<Mediafile> {
        return null;
    }

    public createViewModel(file: Mediafile): ViewMediafile {
        const uploader = this.DS.get(User, file.uploader_id);
        return new ViewMediafile(file, uploader);
    }
}
