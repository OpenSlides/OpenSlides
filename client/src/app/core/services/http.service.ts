import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Enum for different HTTPMethods
 */
export enum HTTPMethod {
    PUT,
    PATCH
}

@Injectable({
    providedIn: 'root'
})
/**
 * Service for sending data back to server
 */
export class HttpService {
    /**
     * Construct a DataSendService
     *
     * @param http The HTTP Client
     */
    public constructor(private http: HttpClient) {}

    /**
     * Exectures a post on a url with a certain object
     * @param url string of the url to send semothing to
     * @param obj the object that should be send
     */
    public create(url: string, obj: object): Observable<object> {
        url = this.formatForSlash(url);
        return this.http.post<object>(url, obj).pipe(
            tap(
                response => {
                    // TODO: Message, Notify, Etc
                    console.log('New object added. Response :\n ', response);
                },
                error => console.error('Error:\n ', error)
            )
        );
    }

    /**
     * Adds a / at the end, if there is none
     * @param str the string where the / should be checked
     */
    private formatForSlash(str: string): string {
        let retStr = '';
        retStr += str;
        return retStr.endsWith('/') ? retStr : (retStr += '/');
    }

    /**
     * Save object in the server
     *
     * @param url string of the url to send semothing to
     * @param obj the object that should be send
     * @param method the HTTP Method that should be used {@link HTTPMethod}
     * @return Observable from object
     */
    public update(url: string, obj: object, method?: HTTPMethod): Observable<object> {
        url = this.formatForSlash(url);
        if (method === null || method === HTTPMethod.PATCH) {
            return this.http.patch<object>(url, obj).pipe(
                tap(
                    response => {
                        console.log('Update object. Response :\n ', response);
                    },
                    error => console.log('Error:\n ', error)
                )
            );
        } else if (method === HTTPMethod.PUT) {
            return this.http.put<object>(url, obj).pipe(
                tap(
                    response => {
                        console.log('Update object. Response :\n ', response);
                    },
                    error => console.error('Error :\n', error)
                )
            );
        }
    }

    /**
     * Deletes the given object on the server
     *
     * @param url the url that should be called to delete the object
     * @return Observable of object
     */
    public delete(url: string): Observable<object> {
        url = this.formatForSlash(url);
        return this.http.delete<object>(url).pipe(
            tap(
                response => {
                    // TODO: Message, Notify, Etc
                    console.log('Delete object. Response:\n', response);
                },
                error => console.error('Error: \n', error)
            )
        );
    }
}
