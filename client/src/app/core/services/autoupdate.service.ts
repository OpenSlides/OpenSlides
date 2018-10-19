import { Injectable } from '@angular/core';

import { OpenSlidesComponent } from 'app/openslides.component';
import { WebsocketService } from './websocket.service';

import { CollectionStringModelMapperService } from './collectionStringModelMapper.service';
import { DataStoreService } from './data-store.service';

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
     * The current change id for this autoupdate
     */
    change_id: number;
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
     */
    public constructor(
        websocketService: WebsocketService,
        private DS: DataStoreService,
        private modelMapper: CollectionStringModelMapperService
    ) {
        super();
        websocketService.getOberservable<AutoupdateFormat>('autoupdate').subscribe(response => {
            this.storeResponse(response);
        });
    }

    /**
     * Handle the answer of incoming data via {@link WebsocketService}.
     *
     * Bundles the data per action and collection. THis speeds up the caching in the DataStore.
     *
     * Detects the Class of an incomming model, creates a new empty object and assigns
     * the data to it using the deserialize function.
     *
     * Saves models in DataStore.
     */
    public storeResponse(autoupdate: AutoupdateFormat): void {
        // Delete the removed objects from the DataStore
        Object.keys(autoupdate.deleted).forEach(collection => {
            this.DS.remove(collection, autoupdate.deleted[collection], autoupdate.change_id);
        });

        // Add the objects to the DataStore.
        Object.keys(autoupdate.changed).forEach(collection => {
            const targetClass = this.modelMapper.getModelConstructor(collection);
            if (!targetClass) {
                throw new Error(`Unregistered resource ${collection}`);
            }
            this.DS.add(autoupdate.changed[collection].map(model => new targetClass(model)), autoupdate.change_id);
        });
    }

    /**
     * Sends a WebSocket request to the Server with the maxChangeId of the DataStore.
     * The server should return an autoupdate with all new data.
     *
     * TODO: Wait for changeIds to be implemented on the server.
     */
    public requestChanges(): void {
        console.log('requesting changed objects');
        // this.websocketService.send('changeIdRequest', this.DS.maxChangeId);
    }
}
