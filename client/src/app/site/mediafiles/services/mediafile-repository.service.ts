import { Injectable } from '@angular/core';

import { BaseRepository } from '../../base/base-repository';
import { ViewMediafile } from '../models/view-mediafile';
import { Mediafile } from '../../../shared/models/mediafiles/mediafile';
import { User } from '../../../shared/models/users/user';
import { DataStoreService } from '../../../core/services/data-store.service';
import { Identifiable } from '../../../shared/models/base/identifiable';

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
    public constructor(DS: DataStoreService) {
        super(DS, Mediafile, [User]);
    }

    /**
     * Saves a config value.
     *
     * TODO: used over not-yet-existing detail view
     */
    public async update(file: Partial<Mediafile>, viewFile: ViewMediafile): Promise<void> {
        return null;
    }

    /**
     * Saves a config value.
     *
     * TODO: used over not-yet-existing detail view
     */
    public async delete(file: ViewMediafile): Promise<void> {
        return null;
    }

    /**
     * Saves a config value.
     *
     * TODO: used over not-yet-existing detail view
     */
    public async create(file: Mediafile): Promise<Identifiable> {
        return null;
    }

    public createViewModel(file: Mediafile): ViewMediafile {
        const uploader = this.DS.get(User, file.uploader_id);
        return new ViewMediafile(file, uploader);
    }
}
