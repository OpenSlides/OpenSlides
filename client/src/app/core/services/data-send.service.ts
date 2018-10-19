import { Injectable } from '@angular/core';
import { BaseModel } from '../../shared/models/base/base-model';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { HTTPMethod } from './http.service';

/**
 * Send data back to server
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
     * @param httpService The HTTP Client
     */
    public constructor(private httpService: HttpService) {}

    /**
     * Sends a post request with the model to the server.
     * Usually for new Models
     */
    public createModel(model: BaseModel): Observable<BaseModel> {
        const restPath = `rest/${model.collectionString}/`;
        return this.httpService.create(restPath, model) as Observable<BaseModel>;
    }

    /**
     * Function to change a model on the server.
     *
     * @param model the base model that is meant to be changed
     * @param method the required http method. might be put or patch
     */
    public updateModel(model: BaseModel, method: HTTPMethod): Observable<BaseModel> {
        const restPath = `rest/${model.collectionString}/${model.id}`;
        return this.httpService.update(restPath, model, method) as Observable<BaseModel>;
    }

    /**
     * Deletes the given model on the server
     *
     * @param model the BaseModel that shall be removed
     * @return Observable of BaseModel
     */
    public deleteModel(model: BaseModel): Observable<BaseModel> {
        const restPath = `rest/${model.collectionString}/${model.id}`;
        return this.httpService.delete(restPath) as Observable<BaseModel>;
    }
}
