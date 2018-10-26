import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

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
     * Construct a HttpService
     *
     * @param http The HTTP Client
     */
    public constructor(private http: HttpClient) {}

    private async send<T>(url: string, method: HTTPMethod, data?: any): Promise<T> {
        if (!url.endsWith('/')) {
            url += '/';
        }

        const options = {
            body: data,
        };

        try {
            const response = await this.http.request<T>(method, url, options).toPromise();
            return response;
        } catch (e) {
            console.log("error", e);
            throw e;
        }
    }

    /**
     * Exectures a get on a url with a certain object
     * @param url The url to send the request to.
     * @param data An optional payload for the request.
     */
    public async get<T>(url: string, data?: any): Promise<T> {
        return await this.send<T>(url, HTTPMethod.GET, data);
    }

    /**
     * Exectures a post on a url with a certain object
     * @param url string of the url to send semothing to
     * @param data The data to send
     */
    public async post<T>(url: string, data: any): Promise<T> {
        return await this.send<T>(url, HTTPMethod.POST, data);
    }

    /**
     * Exectures a put on a url with a certain object
     * @param url string of the url to send semothing to
     * @param data the object that should be send
     */
    public async patch<T>(url: string, data: any): Promise<T> {
        return await this.send<T>(url, HTTPMethod.PATCH, data);
    }

    /**
     * Exectures a put on a url with a certain object
     * @param url the url that should be called
     * @param data: The data to send
     */
    public async put<T>(url: string, data: any): Promise<T> {
        return await this.send<T>(url, HTTPMethod.PUT, data);
    }

    /**
     * Makes a delete request.
     * @param url the url that should be called
     * @param data An optional data to send in the requestbody.
     */
    public async delete<T>(url: string, data?: any): Promise<T> {
        return await this.send<T>(url, HTTPMethod.DELETE, data);
    }
}
