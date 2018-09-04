import { Injectable } from '@angular/core';

import { OpenSlidesComponent } from 'app/openslides.component';
import { WebsocketService } from './websocket.service';

import { CollectionStringModelMapperService } from './collectionStringModelMapper.service';

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
    public constructor(websocketService: WebsocketService) {
        super();
        websocketService.getOberservable<any>('autoupdate').subscribe(response => {
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
    public storeResponse(socketResponse): void {
        // Reorganize the autoupdate: groupy by action, then by collection. The final
        // entries are the single autoupdate objects.
        const autoupdate = {
            changed: {},
            deleted: {}
        };

        // Reorganize them.
        socketResponse.forEach(obj => {
            if (!autoupdate[obj.action][obj.collection]) {
                autoupdate[obj.action][obj.collection] = [];
            }
            autoupdate[obj.action][obj.collection].push(obj);
        });

        // Delete the removed objects from the DataStore
        Object.keys(autoupdate.deleted).forEach(collection => {
            this.DS.remove(collection, ...autoupdate.deleted[collection].map(_obj => _obj.id));
        });

        // Add the objects to the DataStore.
        Object.keys(autoupdate.changed).forEach(collection => {
            const targetClass = CollectionStringModelMapperService.getModelConstructor(collection);
            if (!targetClass) {
                // TODO: throw an error later..
                /*throw new Error*/ console.log(`Unregistered resource ${collection}`);
                return;
            }
            this.DS.add(...autoupdate.changed[collection].map(_obj => new targetClass().deserialize(_obj.data)));
        });
    }

    /**
     * Sends a WebSocket request to the Server with the maxChangeId of the DataStore.
     * The server should return an autoupdate with all new data.
     *
     * TODO: Wait for changeIds to be implemented on the server.
     */
    public requestChanges() {
        console.log('requesting changed objects');
        // this.websocketService.send('changeIdRequest', this.DS.maxChangeId);
    }
}
