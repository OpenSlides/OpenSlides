import { Injectable } from '@angular/core';

import { environment } from 'environments/environment';
import { CollectionStringMapperService } from './collection-string-mapper.service';
import { History } from 'app/shared/models/core/history';
import { DataStoreService } from './data-store.service';
import { WebsocketService } from './websocket.service';
import { BaseModel } from 'app/shared/models/base/base-model';
import { OpenSlidesStatusService } from './openslides-status.service';
import { OpenSlidesService } from './openslides.service';
import { HttpService } from './http.service';

/**
 * Interface for full history data objects.
 * The are not too different from the history-objects,
 * but contain full-data and a timestamp in contrast to a date
 */
interface HistoryData {
    element_id: string;
    full_data: BaseModel;
    information: string;
    timestamp: number;
    user_id: number;
}

/**
 * Service to enable browsing OpenSlides in a previous version.
 *
 * This should stop auto updates, save the current ChangeID and overwrite the DataStore with old Values
 * from the servers History.
 *
 * Restoring is nor possible yet. Simply reload
 */
@Injectable({
    providedIn: 'root'
})
export class TimeTravelService {
    /**
     * Constructs the time travel service
     *
     * @param httpService To fetch the history data
     * @param webSocketService to disable websocket connection
     * @param modelMapperService to cast history objects into models
     * @param DS to overwrite the dataStore
     * @param OSStatus Sets the history status
     * @param OpenSlides For restarting OpenSlide when exiting the history mode
     */
    public constructor(
        private httpService: HttpService,
        private webSocketService: WebsocketService,
        private modelMapperService: CollectionStringMapperService,
        private DS: DataStoreService,
        private OSStatus: OpenSlidesStatusService,
        private OpenSlides: OpenSlidesService
    ) {}

    /**
     * Main entry point to set OpenSlides to another history point.
     *
     * @param history the desired point in the history of OpenSlides
     */
    public async loadHistoryPoint(history: History): Promise<void> {
        await this.stopTime(history);
        const fullDataHistory: HistoryData[] = await this.getHistoryData(history);
        for (const historyObject of fullDataHistory) {
            let collectionString: string;
            let id: string;
            [collectionString, id] = historyObject.element_id.split(':');

            if (historyObject.full_data) {
                const targetClass = this.modelMapperService.getModelConstructor(collectionString);
                await this.DS.add([new targetClass(historyObject.full_data)]);
            } else {
                await this.DS.remove(collectionString, [+id]);
            }
        }
    }

    /**
     * Leaves the history mode. Just restart OpenSlides:
     * The active user is checked, a new WS connection established and
     * all missed auto updates are requested.
     */
    public async resumeTime(): Promise<void> {
        this.OSStatus.leaveHistoryMode();
        await this.DS.set();
        await this.OpenSlides.reboot();
    }

    /**
     * Read the history on a given time
     *
     * @param date the Date object
     * @returns the full history on the given date
     */
    private async getHistoryData(history: History): Promise<HistoryData[]> {
        const historyUrl = '/core/history/';
        const queryParams = { timestamp: Math.ceil(+history.unixtime) };
        return this.httpService.get<HistoryData[]>(environment.urlPrefix + historyUrl, null, queryParams);
    }

    /**
     * Clears the DataStore and stops the WebSocket connection
     */
    private async stopTime(history: History): Promise<void> {
        this.webSocketService.close();
        await this.cleanDataStore();
        this.OSStatus.enterHistoryMode(history);
    }

    /**
     * Clean the DataStore to inject old Data.
     * Remove everything "but" the history.
     */
    private async cleanDataStore(): Promise<void> {
        const historyArchive = this.DS.getAll(History);
        await this.DS.set(historyArchive);
    }
}
