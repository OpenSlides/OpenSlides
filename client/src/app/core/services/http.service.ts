import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';

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
     */
    public constructor(private http: HttpClient, private translate: TranslateService) {
        this.defaultHeaders = new HttpHeaders().set('Content-Type', 'application/json')
    }

    /**
     * Send the a http request the the given URL.
     * Optionally accepts a request body.
     *
     * @param url the target url, usually starting with /rest
     * @param method the required HTTP method (i.e get, post, put)
     * @param data optional, if sending a data body is required
     * @param customHeader optional custom HTTP header of required
     * @returns a promise containing a generic
     */
    private async send<T>(url: string, method: HTTPMethod, data?: any, customHeader?: HttpHeaders): Promise<T> {
        if (!url.endsWith('/')) {
            url += '/';
        }

        const options = {
            body: data,
            headers: customHeader ? customHeader : this.defaultHeaders
        };

        try {
            const response = await this.http.request<T>(method, url, options).toPromise();
            return response;
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
        // If the error is no HttpErrorResponse, it's not clear what is wrong.
        if (!(e instanceof HttpErrorResponse)) {
            console.error('Unknown error thrown by the http client: ', e);
            error += this.translate.instant('An unknown error occurred.');
            return error;
        }

        if (!e.error) {
            error += this.translate.instant("The server didn't respond.");
        } else if (typeof e.error === 'object') {
            if (e.error.detail) {
                error += this.processErrorTexts(e.error.detail);
            } else {
                error = Object.keys(e.error)
                    .map(key => {
                        const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
                        return this.translate.instant(capitalizedKey) + ': ' + this.processErrorTexts(e.error[key]);
                    })
                    .join(', ');
            }
        } else if (e.status === 500) {
            error += this.translate.instant('A server error occured. Please contact your system administrator.');
        } else if (e.status > 500) {
            error += this.translate.instant('The server cound not be reached') + ` (${e.status})`;
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
    private processErrorTexts(str: string | string[]): string {
        if (str instanceof Array) {
            return str.join(' ');
        } else {
            return str;
        }
    }

    /**
     * Exectures a get on a url with a certain object
     * @param url The url to send the request to.
     * @param data An optional payload for the request.
     * @param header optional HTTP header if required
     * @returns A promise holding a generic
     */
    public async get<T>(url: string, data?: any, header?: HttpHeaders): Promise<T> {
        return await this.send<T>(url, HTTPMethod.GET, data, header);
    }

    /**
     * Exectures a post on a url with a certain object
     * @param url The url to send the request to.
     * @param data An optional payload for the request.
     * @param header optional HTTP header if required
     * @returns A promise holding a generic
     */
    public async post<T>(url: string, data?: any, header?: HttpHeaders): Promise<T> {
        return await this.send<T>(url, HTTPMethod.POST, data, header);
    }

    /**
     * Exectures a put on a url with a certain object
     * @param url The url to send the request to.
     * @param data The payload for the request.
     * @param header optional HTTP header if required
     * @returns A promise holding a generic
     */
    public async patch<T>(url: string, data: any, header?: HttpHeaders): Promise<T> {
        return await this.send<T>(url, HTTPMethod.PATCH, data, header);
    }

    /**
     * Exectures a put on a url with a certain object
     * @param url The url to send the request to.
     * @param data: The payload for the request.
     * @param header optional HTTP header if required
     * @returns A promise holding a generic
     */
    public async put<T>(url: string, data: any, header?: HttpHeaders): Promise<T> {
        return await this.send<T>(url, HTTPMethod.PUT, data, header);
    }

    /**
     * Makes a delete request.
     * @param url The url to send the request to.
     * @param data An optional data to send in the requestbody.
     * @param header optional HTTP header if required
     * @returns A promise holding a generic
     */
    public async delete<T>(url: string, data?: any, header?: HttpHeaders): Promise<T> {
        return await this.send<T>(url, HTTPMethod.DELETE, data, header);
    }
}
