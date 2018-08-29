import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseModel } from '../../shared/models/base.model';
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
     * Save motion in the server
     *
     * @return Observable from
     */
    public saveModel(model: BaseModel): Observable<BaseModel> {
        if (!model.id) {
            return this.http.post<BaseModel>('rest/' + model.collectionString + '/', model).pipe(
                tap(
                    response => {
                        // TODO: Message, Notify, Etc
                        console.log('New Model added. Response : ', response);
                    },
                    error => console.log('error. ', error)
                )
            );
        } else {
            return this.http.put<BaseModel>('rest/' + model.collectionString + '/' + model.id, model).pipe(
                tap(
                    response => {
                        console.log('Update model. Response : ', response);
                    },
                    error => console.log('error. ', error)
                )
            );
        }
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
