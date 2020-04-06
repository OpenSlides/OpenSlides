import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { OpenSlidesStatusService } from './openslides-status.service';
import { formatQueryParams, QueryParams } from '../definitions/query-params';

/**
 * Enum for different HTTPMethods
 */
export enum HTTPMethod {
    GET = 'get',
    POST = 'post',
    PUT = 'put',
    PATCH = 'patch',
    DELETE = 'delete'
}

export interface DetailResponse {
    detail: string | string[];
    args?: string[];
}

function isDetailResponse(obj: any): obj is DetailResponse {
    return (
        obj &&
        typeof obj === 'object' &&
        (typeof obj.detail === 'string' || obj.detail instanceof Array) &&
        (!obj.args || obj.args instanceof Array)
    );
}

/**
 * Service for managing HTTP requests. Allows to send data for every method. Also (TODO) will do generic error handling.
 */
@Injectable({
    providedIn: 'root'
})
export class HttpService {
    /**
     * http headers used by most requests
     */
    private defaultHeaders: HttpHeaders;

    /**
     * Construct a HttpService
     *
     * Sets the default headers to application/json
     *
     * @param http The HTTP Client
     * @param translate
     * @param timeTravel requests are only allowed if history mode is disabled
     */
    public constructor(
        private http: HttpClient,
        private translate: TranslateService,
        private OSStatus: OpenSlidesStatusService
    ) {
        this.defaultHeaders = new HttpHeaders().set('Content-Type', 'application/json');
    }

    /**
     * Send the a http request the the given path.
     * Optionally accepts a request body.
     *
     * @param path the target path, usually starting with /rest
     * @param method the required HTTP method (i.e get, post, put)
     * @param data optional, if sending a data body is required
     * @param queryParams optional queryparams to append to the path
     * @param customHeader optional custom HTTP header of required
     * @param responseType optional response type, default set to json (i.e 'arraybuffer')
     * @returns a promise containing a generic
     */
    private async send<T>(
        path: string,
        method: HTTPMethod,
        data?: any,
        queryParams?: QueryParams,
        customHeader?: HttpHeaders,
        responseType?: string
    ): Promise<T> {
        // end early, if we are in history mode
        if (this.OSStatus.isInHistoryMode && method !== HTTPMethod.GET) {
            throw this.handleError('You cannot make changes while in history mode');
        }

        // there is a current bug with the responseType.
        // https://github.com/angular/angular/issues/18586
        // castting it to 'json' allows the usage of the current array
        if (!responseType) {
            responseType = 'json';
        }

        let url = path + formatQueryParams(queryParams);
        if (url[0] !== '/') {
            console.warn(`Please prefix the URL "${url}" with a slash.`);
            url = '/' + url;
        }
        if (this.OSStatus.isPrioritizedClient) {
            url = '/prioritize' + url;
        }

        const options = {
            body: data,
            headers: customHeader ? customHeader : this.defaultHeaders,
            responseType: responseType as 'json'
        };

        try {
            return await this.http.request<T>(method, url, options).toPromise();
        } catch (e) {
            throw this.handleError(e);
        }
    }

    /**
     * Takes an error thrown by the HttpClient. Processes it to return a string that can
     * be presented to the user.
     * @param e The error thrown.
     * @returns The prepared and translated message for the user
     */
    private handleError(e: any): string {
        let error = this.translate.instant('Error') + ': ';
        // If the error is a string already, return it.
        if (typeof e === 'string') {
            return error + e;
        }

        // If the error is no HttpErrorResponse, it's not clear what is wrong.
        if (!(e instanceof HttpErrorResponse)) {
            console.error('Unknown error thrown by the http client: ', e);
            error += this.translate.instant('An unknown error occurred.');
            return error;
        }

        if (e.status === 405) {
            // this should only happen, if the url is wrong -> a bug.
            error += this.translate.instant(
                'The requested method is not allowed. Please contact your system administrator.'
            );
        } else if (!e.error) {
            error += this.translate.instant("The server didn't respond.");
        } else if (typeof e.error === 'object') {
            if (isDetailResponse(e.error)) {
                error += this.processDetailResponse(e.error);
            } else {
                const errorList = Object.keys(e.error).map(key => {
                    const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
                    return `${this.translate.instant(capitalizedKey)}: ${this.processDetailResponse(e.error[key])}`;
                });
                error = errorList.join(', ');
            }
        } else if (e.status === 500) {
            error += this.translate.instant('A server error occured. Please contact your system administrator.');
        } else if (e.status > 500) {
            error += this.translate.instant('The server could not be reached.') + ` (${e.status})`;
        } else {
            error += e.message;
        }

        return error;
    }

    /**
     * Errors from the servers may be string or array of strings. This function joins the strings together,
     * if an array is send.
     * @param str a string or a string array to join together.
     * @returns Error text(s) as single string
     */
    private processDetailResponse(response: DetailResponse): string {
        let message: string;
        if (response instanceof Array) {
            message = response.join(' ');
        } else if (response.detail instanceof Array) {
            message = response.detail.join(' ');
        } else {
            message = response.detail;
        }
        message = this.translate.instant(message);

        if (response.args && response.args.length > 0) {
            for (let i = 0; i < response.args.length; i++) {
                message = message.replace(`{${i}}`, response.args[i].toString());
            }
        }
        return message;
    }

    /**
     * Executes a get on a path with a certain object
     * @param path The path to send the request to.
     * @param data An optional payload for the request.
     * @param queryParams Optional params appended to the path as the query part of the url.
     * @param header optional HTTP header if required
     * @param responseType option expected response type by the request (i.e 'arraybuffer')
     * @returns A promise holding a generic
     */
    public async get<T>(
        path: string,
        data?: any,
        queryParams?: QueryParams,
        header?: HttpHeaders,
        responseType?: string
    ): Promise<T> {
        return await this.send<T>(path, HTTPMethod.GET, data, queryParams, header, responseType);
    }

    /**
     * Executes a post on a path with a certain object
     * @param path The path to send the request to.
     * @param data An optional payload for the request.
     * @param queryParams Optional params appended to the path as the query part of the url.
     * @param header optional HTTP header if required
     * @returns A promise holding a generic
     */
    public async post<T>(path: string, data?: any, queryParams?: QueryParams, header?: HttpHeaders): Promise<T> {
        return await this.send<T>(path, HTTPMethod.POST, data, queryParams, header);
    }

    /**
     * Executes a put on a path with a certain object
     * @param path The path to send the request to.
     * @param data An optional payload for the request.
     * @param queryParams Optional params appended to the path as the query part of the url.
     * @param header optional HTTP header if required
     * @returns A promise holding a generic
     */
    public async patch<T>(path: string, data?: any, queryParams?: QueryParams, header?: HttpHeaders): Promise<T> {
        return await this.send<T>(path, HTTPMethod.PATCH, data, queryParams, header);
    }

    /**
     * Executes a put on a path with a certain object
     * @param path The path to send the request to.
     * @param data An optional payload for the request.
     * @param queryParams Optional params appended to the path as the query part of the url.
     * @param header optional HTTP header if required
     * @returns A promise holding a generic
     */
    public async put<T>(path: string, data?: any, queryParams?: QueryParams, header?: HttpHeaders): Promise<T> {
        return await this.send<T>(path, HTTPMethod.PUT, data, queryParams, header);
    }

    /**
     * Makes a delete request.
     * @param url The path to send the request to.
     * @param data An optional payload for the request.
     * @param queryParams Optional params appended to the path as the query part of the url.
     * @param header optional HTTP header if required
     * @returns A promise holding a generic
     */
    public async delete<T>(path: string, data?: any, queryParams?: QueryParams, header?: HttpHeaders): Promise<T> {
        return await this.send<T>(path, HTTPMethod.DELETE, data, queryParams, header);
    }
}
