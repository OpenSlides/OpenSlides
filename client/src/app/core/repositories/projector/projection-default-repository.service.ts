import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { BaseRepository } from '../base-repository';
import { CollectionStringMapperService } from '../../core-services/collection-string-mapper.service';
import { DataSendService } from '../../core-services/data-send.service';
import { DataStoreService } from '../../core-services/data-store.service';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { ProjectionDefault } from 'app/shared/models/core/projection-default';
import { ViewProjectionDefault } from 'app/site/projector/models/view-projection-default';

/**
 * Manages all projection default instances.
 */
@Injectable({
    providedIn: 'root'
})
export class ProjectionDefaultRepositoryService extends BaseRepository<ViewProjectionDefault, ProjectionDefault> {
    /**
     * Constructor calls the parent constructor
     *
     * @param DS The DataStore
     * @param dataSend sending changed objects
     * @param mapperService Maps collection strings to classes
     * @param viewModelStoreService
     * @param translate
     */
    public constructor(
        DS: DataStoreService,
        dataSend: DataSendService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        translate: TranslateService
    ) {
        super(DS, dataSend, mapperService, viewModelStoreService, translate, ProjectionDefault);
    }

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Projectiondefaults' : 'Projectiondefault');
    };

    public getTitle = (projectionDefault: Partial<ProjectionDefault> | Partial<ViewProjectionDefault>) => {
        return this.translate.instant(projectionDefault.display_name);
    };

    public createViewModel(projectionDefault: ProjectionDefault): ViewProjectionDefault {
        const viewProjectionDefault = new ViewProjectionDefault(projectionDefault);
        viewProjectionDefault.getVerboseName = this.getVerboseName;
        viewProjectionDefault.getTitle = () => this.getTitle(viewProjectionDefault);
        return viewProjectionDefault;
    }

    /**
     * Creation of projection defaults is not supported.
     */
    public async create(projectorData: Partial<ProjectionDefault>): Promise<Identifiable> {
        throw new Error('Not supported');
    }

    /**
     * Deletion of projection defaults is not supported.
     */
    public async delete(viewProjectionDefault: ViewProjectionDefault): Promise<void> {
        throw new Error('Not supported');
    }
}
