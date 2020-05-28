import { Injectable } from '@angular/core';

import { BaseModel } from '../../shared/models/base/base-model';
import { CollectionStringMapperService } from './collection-string-mapper.service';
import { DataStoreService, DataStoreUpdateManagerService } from './data-store.service';
import { Mutex } from '../promises/mutex';
import { WebsocketService, WEBSOCKET_ERROR_CODES } from './websocket.service';

export interface AutoupdateFormat {
    /**
     * All changed (and created) items as their full/restricted data grouped by their collection.
     */
    changed: {
        [collectionString: string]: object[];
    };

    /**
     * All deleted items (by id) grouped by their collection.
     */
    deleted: {
        [collectionString: string]: number[];
    };

    /**
     * The lower change id bond for this autoupdate
     */
    from_change_id: number;

    /**
     * The upper change id bound for this autoupdate
     */
    to_change_id: number;

    /**
     * Flag, if this autoupdate contains all data. If so, the DS needs to be resetted.
     */
    all_data: boolean;
}

export function isAutoupdateFormat(obj: any): obj is AutoupdateFormat {
    const format = obj as AutoupdateFormat;
    return (
        obj &&
        typeof obj === 'object' &&
        format.changed !== undefined &&
        format.deleted !== undefined &&
        format.from_change_id !== undefined &&
        format.to_change_id !== undefined &&
        format.all_data !== undefined
    );
}

/**
 * Handles the initial update and automatic updates using the {@link WebsocketService}
 * Incoming objects, usually BaseModels, will be saved in the dataStore (`this.DS`)
 * This service usually creates all models
 */
@Injectable({
    providedIn: 'root'
})
export class AutoupdateService {
    private mutex = new Mutex();

    /**
     * Constructor to create the AutoupdateService. Calls the constructor of the parent class.
     * @param websocketService
     * @param DS
     * @param modelMapper
     */
    public constructor(
        private websocketService: WebsocketService,
        private DS: DataStoreService,
        private modelMapper: CollectionStringMapperService,
        private DSUpdateManager: DataStoreUpdateManagerService
    ) {
        this.websocketService.getOberservable<AutoupdateFormat>('autoupdate').subscribe(response => {
            this.storeResponse(response);
        });

        // Check for too high change id-errors. If this happens, reset the DS and get fresh data.
        this.websocketService.errorResponseObservable.subscribe(error => {
            if (error.code === WEBSOCKET_ERROR_CODES.CHANGE_ID_TOO_HIGH) {
                this.doFullUpdate();
            }
        });
    }

    /**
     * Handle the answer of incoming data via {@link WebsocketService}.
     *
     * Detects the Class of an incomming model, creates a new empty object and assigns
     * the data to it using the deserialize function. Also models that are flagged as deleted
     * will be removed from the data store.
     *
     * Handles the change ids of all autoupdates.
     */
    private async storeResponse(autoupdate: AutoupdateFormat): Promise<void> {
        const unlock = await this.mutex.lock();
        if (autoupdate.all_data) {
            await this.storeAllData(autoupdate);
        } else {
            await this.storePartialAutoupdate(autoupdate);
        }
        unlock();
    }

    /**
     * Stores all data from the autoupdate. This means, that the DS is resetted and filled with just the
     * given data from the autoupdate.
     * @param autoupdate The autoupdate
     */
    private async storeAllData(autoupdate: AutoupdateFormat): Promise<void> {
        let elements: BaseModel[] = [];
        Object.keys(autoupdate.changed).forEach(collection => {
            elements = elements.concat(this.mapObjectsToBaseModels(collection, autoupdate.changed[collection]));
        });

        const updateSlot = await this.DSUpdateManager.getNewUpdateSlot(this.DS);
        await this.DS.set(elements, autoupdate.to_change_id);
        this.DSUpdateManager.commit(updateSlot, autoupdate.to_change_id, true);
    }

    /**
     * handles a normal autoupdate that is not a full update (all_data=false).
     * @param autoupdate The autoupdate
     */
    private async storePartialAutoupdate(autoupdate: AutoupdateFormat): Promise<void> {
        const maxChangeId = this.DS.maxChangeId;

        if (autoupdate.from_change_id <= maxChangeId && autoupdate.to_change_id <= maxChangeId) {
            console.log(`Ignore. Clients change id: ${maxChangeId}`);
            return; // Ignore autoupdates, that lay full behind our changeid.
        }

        // Normal autoupdate
        if (autoupdate.from_change_id <= maxChangeId + 1 && autoupdate.to_change_id > maxChangeId) {
            await this.injectAutupdateIntoDS(autoupdate, true);
        } else {
            // autoupdate fully in the future. we are missing something!
            console.log('Autoupdate in the future', maxChangeId, autoupdate.from_change_id, autoupdate.to_change_id);
            this.requestChanges();
        }
    }

    public async injectAutoupdateIgnoreChangeId(autoupdate: AutoupdateFormat): Promise<void> {
        const unlock = await this.mutex.lock();
        console.debug('inject autoupdate', autoupdate);
        await this.injectAutupdateIntoDS(autoupdate, false);
        unlock();
    }

    private async injectAutupdateIntoDS(autoupdate: AutoupdateFormat, flush: boolean): Promise<void> {
        const updateSlot = await this.DSUpdateManager.getNewUpdateSlot(this.DS);

        // Delete the removed objects from the DataStore
        for (const collection of Object.keys(autoupdate.deleted)) {
            await this.DS.remove(collection, autoupdate.deleted[collection]);
        }

        // Add the objects to the DataStore.
        for (const collection of Object.keys(autoupdate.changed)) {
            await this.DS.add(this.mapObjectsToBaseModels(collection, autoupdate.changed[collection]));
        }

        if (flush) {
            await this.DS.flushToStorage(autoupdate.to_change_id);
        }

        this.DSUpdateManager.commit(updateSlot, autoupdate.to_change_id);
    }

    /**
     * Creates baseModels for each plain object. If the collection is not registered,
     * A console error will be issued and an empty list returned.
     *
     * @param collection The collection all models have to be from.
     * @param models All models that should be mapped to BaseModels
     * @returns A list of basemodels constructed from the given models.
     */
    private mapObjectsToBaseModels(collection: string, models: object[]): BaseModel[] {
        if (this.modelMapper.isCollectionRegistered(collection)) {
            const targetClass = this.modelMapper.getModelConstructor(collection);
            return models.map(model => new targetClass(model));
        } else {
            console.error(`Unregistered collection "${collection}". Ignore it.`);
            return [];
        }
    }

    /**
     * Sends a WebSocket request to the Server with the maxChangeId of the DataStore.
     * The server should return an autoupdate with all new data.
     */
    public requestChanges(): void {
        console.log(`requesting changed objects with DS max change id ${this.DS.maxChangeId}`);
        this.websocketService.send('getElements', { change_id: this.DS.maxChangeId });
    }

    /**
     * Does a full update: Requests all data from the server and sets the DS to the fresh data.
     */
    public async doFullUpdate(): Promise<void> {
        const oldChangeId = this.DS.maxChangeId;
        const response = await this.websocketService.sendAndGetResponse<{}, AutoupdateFormat>('getElements', {});

        const updateSlot = await this.DSUpdateManager.getNewUpdateSlot(this.DS);
        let allModels: BaseModel[] = [];
        for (const collection of Object.keys(response.changed)) {
            if (this.modelMapper.isCollectionRegistered(collection)) {
                allModels = allModels.concat(this.mapObjectsToBaseModels(collection, response.changed[collection]));
            } else {
                console.error(`Unregistered collection "${collection}". Ignore it.`);
            }
        }

        await this.DS.set(allModels, response.to_change_id);
        this.DSUpdateManager.commit(updateSlot, response.to_change_id, true);

        console.log(`Full update done from ${oldChangeId} to ${response.to_change_id}`);
    }
}
