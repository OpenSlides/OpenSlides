import { Injectable } from '@angular/core';

import { OpenSlidesComponent } from 'app/openslides.component';
import { WebsocketService } from './websocket.service';

import { CollectionStringModelMapperService } from './collectionStringModelMapper.service';
import { DataStoreService } from './data-store.service';
import { BaseModel } from '../../shared/models/base/base-model';

interface AutoupdateFormat {
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

/**
 * Handles the initial update and automatic updates using the {@link WebsocketService}
 * Incoming objects, usually BaseModels, will be saved in the dataStore (`this.DS`)
 * This service usually creates all models
 *
 * The dataStore will injected over the parent class: {@link OpenSlidesComponent}.
 */
@Injectable({
    providedIn: 'root'
})
export class AutoupdateService extends OpenSlidesComponent {
    /**
     * Constructor to create the AutoupdateService. Calls the constructor of the parent class.
     * @param websocketService
     * @param DS
     * @param modelMapper
     */
    public constructor(
        private websocketService: WebsocketService,
        private DS: DataStoreService,
        private modelMapper: CollectionStringModelMapperService
    ) {
        super();
        this.websocketService.getOberservable<AutoupdateFormat>('autoupdate').subscribe(response => {
            this.storeResponse(response);
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
        console.log('got autoupdate', autoupdate);

        if (autoupdate.all_data) {
            await this.storeAllData(autoupdate);
        } else {
            await this.storePartialAutoupdate(autoupdate);
        }
    }

    /**
     * Stores all data from the autoupdate. This means, that the DS is resettet and filled with just the
     * given data from the autoupdate.
     * @param autoupdate The autoupdate
     */
    private async storeAllData(autoupdate: AutoupdateFormat): Promise<void> {
        let elements: BaseModel[] = [];
        Object.keys(autoupdate.changed).forEach(collection => {
            elements = elements.concat(this.mapObjectsToBaseModels(collection, autoupdate.changed[collection]));
        });
        await this.DS.set(elements, autoupdate.to_change_id);
    }

    /**
     * handles a normal autoupdate that is not a full update (all_data=false).
     * @param autoupdate The autoupdate
     */
    private async storePartialAutoupdate(autoupdate: AutoupdateFormat): Promise<void> {
        const maxChangeId = this.DS.maxChangeId;

        if (autoupdate.from_change_id <= maxChangeId && autoupdate.to_change_id <= maxChangeId) {
            console.log('ignore');
            return; // Ignore autoupdates, that lay full behind our changeid.
        }

        // Normal autoupdate
        if (autoupdate.from_change_id <= maxChangeId + 1 && autoupdate.to_change_id > maxChangeId) {
            // Delete the removed objects from the DataStore
            for (const collection of Object.keys(autoupdate.deleted)) {
                await this.DS.remove(collection, autoupdate.deleted[collection]);
            }

            // Add the objects to the DataStore.
            for (const collection of Object.keys(autoupdate.changed)) {
                await this.DS.add(this.mapObjectsToBaseModels(collection, autoupdate.changed[collection]));
            }

            console.log('new max change id', autoupdate.to_change_id);
            await this.DS.flushToStorage(autoupdate.to_change_id);
        } else {
            // autoupdate fully in the future. we are missing something!
            this.requestChanges();
        }
    }

    /**
     * Creates baseModels for each plain object
     * @param collection The collection all models have to be from.
     * @param models All models that should be mapped to BaseModels
     * @returns A list of basemodels constructed from the given models.
     */
    private mapObjectsToBaseModels(collection: string, models: object[]): BaseModel[] {
        const targetClass = this.modelMapper.getModelConstructor(collection);
        if (!targetClass) {
            throw new Error(`Unregistered resource ${collection}`);
        }
        return models.map(model => new targetClass(model));
    }

    /**
     * Sends a WebSocket request to the Server with the maxChangeId of the DataStore.
     * The server should return an autoupdate with all new data.
     */
    public requestChanges(): void {
        console.log('requesting changed objects with DS max change id', this.DS.maxChangeId + 1);
        this.websocketService.send('getElements', { change_id: this.DS.maxChangeId + 1 });
    }
}
