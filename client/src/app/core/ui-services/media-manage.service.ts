import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { HttpService } from 'app/core/core-services/http.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { ViewMediafile } from '../../site/mediafiles/models/view-mediafile';

/**
 * The structure of an image config object
 */
interface ImageConfigObject {
    display_name: string;
    key: string;
    path: string;
}

/**
 * The structure of a font config
 */
export interface FontConfigObject {
    display_name: string;
    default: string;
    path: string;
}

/**
 * Holds the required structure of the manage payload
 */
interface ManagementPayload {
    id: number;
    key?: string;
    default?: string;
    value: ImageConfigObject | FontConfigObject;
}

/**
 * The service to manage Mediafiles.
 *
 * Declaring images as logos (web, projector, pdf, ...) is handles here.
 */
@Injectable({
    providedIn: 'root'
})
export class MediaManageService {
    /**
     * Constructor for the MediaManage service
     *
     * @param httpService OpenSlides own HttpService
     */
    public constructor(private config: ConfigService, private httpService: HttpService) {}

    /**
     * Sets the given Mediafile to using the given management option
     * i.e: setting another projector logo
     *
     * TODO: Feels overly complicated. However, the server seems to requires a strictly shaped payload
     *
     * @param file the selected Mediafile
     * @param action determines the action
     */
    public async setAs(file: ViewMediafile, action: string): Promise<void> {
        const restPath = `/rest/core/config/${action}/`;

        const config = this.getMediaConfig(action);
        const path = config.path !== file.url ? file.url : '';

        // Create the payload that the server requires to manage a mediafile
        const payload: ManagementPayload = {
            id: file.id,
            key: (config as ImageConfigObject).key,
            default: (config as FontConfigObject).default,
            value: {
                display_name: config.display_name,
                key: (config as ImageConfigObject).key,
                default: (config as FontConfigObject).default,
                path: path
            }
        };

        return this.httpService.put<void>(restPath, payload);
    }

    /**
     * Checks if an image is an imageConfig Object
     *
     * @param object instance of something to check
     * @returns boolean if an object is a ImageConfigObject
     */
    public isImageConfigObject(object: any): object is ImageConfigObject {
        if (object !== undefined) {
            return (<ImageConfigObject>object).path !== undefined;
        }
    }

    /**
     * Get all actions that can be executed on images
     *
     * @returns observable array of strings with the actions for images
     */
    public getLogoActions(): Observable<string[]> {
        return this.config.get('logos_available');
    }

    /**
     * Get all actions that can be executed on fonts
     *
     * @returns observable array of string with the actions for fonts
     */
    public getFontActions(): Observable<string[]> {
        return this.config.get('fonts_available');
    }

    /**
     * returns the config object to a given action
     *
     * @param action the logo action or font action
     * @returns A media config object containing the requested values
     */
    public getMediaConfig(action: string): ImageConfigObject | FontConfigObject | null {
        return this.config.instant(action);
    }
}
