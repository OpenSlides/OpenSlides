import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { HttpService } from 'app/core/core-services/http.service';
import { RelationManagerService } from 'app/core/core-services/relation-manager.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { RelationDefinition } from 'app/core/definitions/relations';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { Projector } from 'app/shared/models/core/projector';
import { ProjectorTitleInformation, ViewProjector } from 'app/site/projector/models/view-projector';
import { BaseRepository } from '../base-repository';
import { CollectionStringMapperService } from '../../core-services/collection-string-mapper.service';
import { DataSendService } from '../../core-services/data-send.service';
import { DataStoreService } from '../../core-services/data-store.service';

/**
 * Directions for scale and scroll requests.
 */
export enum ScrollScaleDirection {
    Up = 'up',
    Down = 'down',
    Reset = 'reset'
}

const ProjectorRelations: RelationDefinition[] = [
    {
        type: 'M2O',
        ownIdKey: 'reference_projector_id',
        ownKey: 'referenceProjector',
        foreignViewModel: ViewProjector
    }
];

/**
 * Manages all projector instances.
 */
@Injectable({
    providedIn: 'root'
})
export class ProjectorRepositoryService extends BaseRepository<ViewProjector, Projector, ProjectorTitleInformation> {
    /**
     * Constructor calls the parent constructor
     *
     * @param DS The DataStore
     * @param mapperService Maps collection strings to classes
     * @param dataSend sending changed objects
     * @param http
     */
    public constructor(
        DS: DataStoreService,
        dataSend: DataSendService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        translate: TranslateService,
        relationManager: RelationManagerService,
        private http: HttpService
    ) {
        super(
            DS,
            dataSend,
            mapperService,
            viewModelStoreService,
            translate,
            relationManager,
            Projector,
            ProjectorRelations
        );
    }

    public getTitle = (titleInformation: ProjectorTitleInformation) => {
        return titleInformation.name;
    };

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Projectors' : 'Projector');
    };

    /**
     * Creates a new projector. Adds the clock as default, stable element
     */
    public async create(projectorData: Partial<Projector>): Promise<Identifiable> {
        const projector = new Projector(projectorData);
        projector.elements = [{ name: 'core/clock', stable: true }];
        return await this.dataSend.createModel(projector);
    }

    /**
     * Scroll the given projector.
     *
     * @param projector The projector to scroll
     * @param direction The direction.
     * @param step (default 1) The amount of scroll-steps
     */
    public async scroll(projector: ViewProjector, direction: ScrollScaleDirection, step: number = 1): Promise<void> {
        await this.controlView(projector, direction, 'scroll', step);
    }

    /**
     * Scale the given projector.
     *
     * @param projector The projector to scale
     * @param direction The direction.
     * @param step (default 1) The amount of scale-steps
     */
    public async scale(projector: ViewProjector, direction: ScrollScaleDirection, step: number = 1): Promise<void> {
        await this.controlView(projector, direction, 'scale', step);
    }

    /**
     * Controls the view of a projector.
     *
     * @param projector The projector to control.
     * @param direction The direction
     * @param action The action. Can be scale or scroll.
     * @param step The amount of steps to make.
     */
    private async controlView(
        projector: ViewProjector,
        direction: ScrollScaleDirection,
        action: 'scale' | 'scroll',
        step: number
    ): Promise<void> {
        await this.http.post<void>(`/rest/core/projector/${projector.id}/control_view/`, {
            action: action,
            direction: direction,
            step: step
        });
    }

    /**
     * Sets the given projector as the new reference projector for all projectors
     * @param projector the new reference projector id
     */
    public async setReferenceProjector(projector_id: number): Promise<void> {
        await this.http.post<void>(`/rest/core/projector/${projector_id}/set_reference_projector/`);
    }

    /**
     * return the id of the current reference projector
     */
    public getReferenceProjectorId(): number {
        return this.getViewModelList().find(projector => projector.isReferenceProjector).id;
    }
}
