import { Injectable } from '@angular/core';

import { BaseModel } from '../../shared/models/base/base-model';
import { HttpService } from './http.service';
import { Identifiable } from '../../shared/models/base/identifiable';

/**
 * Send data back to server. Cares about the right REST routes.
 *
 * Contrast to dataStore service
 */
@Injectable({
    providedIn: 'root'
})
export class DataSendService {
    /**
     * Construct a DataSendService
     *
     * @param httpService The HTTP Service
     */
    public constructor(private httpService: HttpService) {}

    /**
     * Sends a post request with the model to the server to create it.
     *
     * @param model The model to create.
     */
    public async createModel(model: BaseModel): Promise<Identifiable> {
        const restPath = `/rest/${model.collectionString}/`;
        return await this.httpService.post<Identifiable>(restPath, model);
    }

    /**
     * Function to fully update a model on the server.
     *
     * @param model The model that is meant to be changed.
     */
    public async updateModel(model: BaseModel): Promise<void> {
        const restPath = `/rest/${model.collectionString}/${model.id}/`;
        await this.httpService.put(restPath, model);
    }

    /**
     * Updates a model partially on the server.
     *
     * @param model The model to partially update.
     */
    public async partialUpdateModel(model: BaseModel): Promise<void> {
        const restPath = `/rest/${model.collectionString}/${model.id}/`;
        await this.httpService.patch(restPath, model);
    }

    /**
     * Deletes the given model on the server.
     *
     * @param model the model that shall be deleted.
     */
    public async deleteModel(model: BaseModel): Promise<void> {
        const restPath = `/rest/${model.collectionString}/${model.id}/`;
        await this.httpService.delete(restPath);
    }
}
