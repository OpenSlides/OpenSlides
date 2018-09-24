import { Injectable } from '@angular/core';

import { BaseRepository } from '../../base/base-repository';
import { ViewConfig } from '../models/view-config';
import { Config } from '../../../shared/models/core/config';
import { Observable } from 'rxjs';
import { DataStoreService } from '../../../core/services/data-store.service';

/**
 * Repository for Configs.
 *
 * Documentation provided over {@link BaseRepository}
 */
@Injectable({
    providedIn: 'root'
})
export class ConfigRepositoryService extends BaseRepository<ViewConfig, Config> {
    /**
     * Constructor for ConfigRepositoryService
     */
    public constructor(DS: DataStoreService) {
        super(DS, Config);
    }

    /**
     * Saves a config value.
     *
     * TODO: used over not-yet-existing detail view
     */
    public update(config: Partial<Config>, viewConfig: ViewConfig): Observable<Config> {
        return null;
    }

    /**
     * This particular function should never be necessary since the creation of config
     * values is not planed.
     *
     * Function exists solely to correctly implement {@link BaseRepository}
     */
    public delete(config: ViewConfig): Observable<Config> {
        return null;
    }

    /**
     * This particular function should never be necessary since the creation of config
     * values is not planed.
     *
     * Function exists solely to correctly implement {@link BaseRepository}
     */
    public create(config: Config): Observable<Config> {
        return null;
    }

    /**
     * Creates a new ViewConfig of a given Config object
     * @param config
     */
    public createViewModel(config: Config): ViewConfig {
        return new ViewConfig(config);
    }
}
