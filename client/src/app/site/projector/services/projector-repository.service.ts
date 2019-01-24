import { Injectable } from '@angular/core';

import { BaseRepository } from '../../base/base-repository';
import { CollectionStringModelMapperService } from '../../../core/services/collectionStringModelMapper.service';
import { DataSendService } from '../../../core/services/data-send.service';
import { DataStoreService } from '../../../core/services/data-store.service';
import { Identifiable } from '../../../shared/models/base/identifiable';
import { ViewProjector } from '../models/view-projector';
import { Projector } from '../../../shared/models/core/projector';
import { HttpService } from 'app/core/services/http.service';

/**
 * Directions for scale and scroll requests.
 */
export enum ScrollScaleDirection {
    Up = 'up',
    Down = 'down',
    Reset = 'reset'
}

/**
 * Manages all projector instances.
 */
@Injectable({
    providedIn: 'root'
})
export class ProjectorRepositoryService extends BaseRepository<ViewProjector, Projector> {
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
        mapperService: CollectionStringModelMapperService,
        private dataSend: DataSendService,
        private http: HttpService
    ) {
        super(DS, mapperService, Projector);
    }

    /**
     * Creates a new projector. Adds the clock as default, stable element
     */
    public async create(projectorData: Partial<Projector>): Promise<Identifiable> {
        const projector = new Projector();
        projector.patchValues(projectorData);
        projector.elements = [{ name: 'core/clock', stable: true }];
        return await this.dataSend.createModel(projector);
    }

    /**
     * Updates a projector.
     */
    public async update(projectorData: Partial<Projector>, viewProjector: ViewProjector): Promise<void> {
        const projector = new Projector();
        projector.patchValues(viewProjector.projector);
        projector.patchValues(projectorData);
        await this.dataSend.updateModel(projector);
    }

    /**
     * Deletes a given projector.
     *
     * @param projector
     */
    public async delete(projector: ViewProjector): Promise<void> {
        await this.dataSend.deleteModel(projector.projector);
    }

    public createViewModel(projector: Projector): ViewProjector {
        return new ViewProjector(projector);
    }

    /**
     * Scroll the given projector.
     *
     * @param projector The projector to scroll
     * @param direction The direction.
     */
    public async scroll(projector: ViewProjector, direction: ScrollScaleDirection): Promise<void> {
        await this.controlView(projector, direction, 'scroll');
    }

    /**
     * Scale the given projector.
     *
     * @param projector The projector to scale
     * @param direction The direction.
     */
    public async scale(projector: ViewProjector, direction: ScrollScaleDirection): Promise<void> {
        await this.controlView(projector, direction, 'scale');
    }

    /**
     * Controls the view of a projector.
     *
     * @param projector The projector to control.
     * @param direction The direction
     * @param action The action. Can be scale or scroll.
     */
    private async controlView(
        projector: ViewProjector,
        direction: ScrollScaleDirection,
        action: 'scale' | 'scroll'
    ): Promise<void> {
        await this.http.post<void>(`/rest/core/projector/${projector.id}/control_view/`, {
            action: action,
            direction: direction
        });
    }
}
