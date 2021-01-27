import { Injectable } from '@angular/core';

import { AutoupdateFormat } from '../definitions/autoupdate-format';
import { AutoupdateThrottleService } from './autoupdate-throttle.service';
import { BaseModel } from '../../shared/models/base/base-model';
import { CollectionStringMapperService } from './collection-string-mapper.service';
import { CommunicationManagerService, OfflineError } from './communication-manager.service';
import { DataStoreService, DataStoreUpdateManagerService } from './data-store.service';
import { HttpService } from './http.service';
import { Mutex } from '../promises/mutex';

/**
 * Handles the initial update and automatic updates
 * Incoming objects, usually BaseModels, will be saved in the dataStore (`this.DS`)
 * This service usually creates all models
 */
@Injectable({
    providedIn: 'root'
})
export class AutoupdateService {
    private mutex = new Mutex();

    private streamCloseFn: () => void | null = null;

    private lastMessageContainedAllData = false;

    public constructor(
        private DS: DataStoreService,
        private modelMapper: CollectionStringMapperService,
        private DSUpdateManager: DataStoreUpdateManagerService,
        private communicationManager: CommunicationManagerService,
        private autoupdateThrottle: AutoupdateThrottleService
    ) {
        this.communicationManager.startCommunicationEvent.subscribe(() => this.startAutoupdate());

        this.autoupdateThrottle.autoupdatesToInject.subscribe(autoupdate => this.storeAutoupdate(autoupdate));
    }

    public async startAutoupdate(changeId?: number): Promise<void> {
        this.stopAutoupdate();

        try {
            this.streamCloseFn = await this.communicationManager.subscribe<AutoupdateFormat>(
                '/system/autoupdate',
                autoupdate => {
                    this.autoupdateThrottle.newAutoupdate(autoupdate);
                },
                () => ({ change_id: (changeId ? changeId : this.DS.maxChangeId).toString() })
            );
        } catch (e) {
            if (!(e instanceof OfflineError)) {
                console.error(e);
            }
        }
    }

    public stopAutoupdate(): void {
        if (this.streamCloseFn) {
            this.streamCloseFn();
            this.streamCloseFn = null;
        }
        this.autoupdateThrottle.discard();
    }

    /**
     * Handle the answer of incoming data, after it was throttled.
     *
     * Detects the Class of an incomming model, creates a new empty object and assigns
     * the data to it using the deserialize function. Also models that are flagged as deleted
     * will be removed from the data store.
     *
     * Handles the change ids of all autoupdates.
     */
    private async storeAutoupdate(autoupdate: AutoupdateFormat): Promise<void> {
        const unlock = await this.mutex.lock();
        this.lastMessageContainedAllData = autoupdate.all_data;
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
            this.startAutoupdate(); // restarts it.
        }
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
     * Does a full update: Requests all data from the server and sets the DS to the fresh data.
     */
    public async doFullUpdate(): Promise<void> {
        if (this.lastMessageContainedAllData) {
            console.log('full update requested. Skipping, last message already contained all data');
        } else {
            console.log('requesting full update.');
            // The mutex is needed, so the DS is not cleared, if there is
            // another autoupdate running.
            const unlock = await this.mutex.lock();
            this.stopAutoupdate();
            await this.DS.clear();
            this.startAutoupdate();
            unlock();
        }
    }
}
