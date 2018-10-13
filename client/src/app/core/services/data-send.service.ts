import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseModel } from '../../shared/models/base/base-model';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

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
     * @param http The HTTP Client
     */
    public constructor(private http: HttpClient) {}

    /**
     * Sends a post request with the model to the server.
     * Usually for new Models
     */
    public createModel(model: BaseModel): Observable<BaseModel> {
        return this.http.post<BaseModel>('rest/' + model.collectionString + '/', model).pipe(
            tap(
                response => {
                    // TODO: Message, Notify, Etc
                    console.log('New Model added. Response ::\n', response);
                },
                error => console.error('createModel has returned an Error:\n', error)
            )
        );
    }

    /**
     * Function to change a model on the server.
     *
     * @param model the base model that is meant to be changed
     * @param method the required http method. might be put or patch
     */
    public updateModel(model: BaseModel, method: 'put' | 'patch'): Observable<BaseModel> {
        const restPath = `rest/${model.collectionString}/${model.id}`;
        let httpMethod;

        if (method === 'patch') {
            httpMethod = this.http.patch<BaseModel>(restPath, model);
        } else if (method === 'put') {
            httpMethod = this.http.put<BaseModel>(restPath, model);
        }

        return httpMethod.pipe(
            tap(
                response => {
                    // TODO: Message, Notify, Etc
                    console.log('Update model. Response ::\n', response);
                },
                error => console.error('updateModel has returned an Error:\n', error)
            )
        );
    }

    /**
     * Deletes the given model on the server
     *
     * @param model the BaseModel that shall be removed
     * @return Observable of BaseModel
     *
     * TODO Not tested
     */
    public delete(model: BaseModel): Observable<BaseModel> {
        if (model.id) {
            return this.http.delete<BaseModel>('rest/' + model.collectionString + '/' + model.id).pipe(
                tap(
                    response => {
                        // TODO: Message, Notify, Etc
                        console.log('the response: ', response);
                    },
                    error => console.error('error during delete: ', error)
                )
            );
        } else {
            console.error('No model ID to delete');
        }
    }
}
