import { Injectable } from '@angular/core';

import { OpenSlidesComponent } from 'app/openslides.component';
import { WebsocketService } from './websocket.service';
// the Models
import { Item } from 'app/shared/models/agenda/item';
import { Assignment } from 'app/shared/models/assignments/assignment';
import { ChatMessage } from 'app/shared/models/core/chat-message';
import { Config } from 'app/shared/models/core/config';
import { Countdown } from 'app/shared/models/core/countdown';
import { ProjectorMessage } from 'app/shared/models/core/projector-message';
import { Projector } from 'app/shared/models/core/projector';
import { Tag } from 'app/shared/models/core/tag';
import { Mediafile } from 'app/shared/models/mediafiles/mediafile';
import { Category } from 'app/shared/models/motions/category';
import { MotionBlock } from 'app/shared/models/motions/motion-block';
import { MotionChangeReco } from 'app/shared/models/motions/motion-change-reco';
import { Motion } from 'app/shared/models/motions/motion';
import { Workflow } from 'app/shared/models/motions/workflow';
import { Topic } from 'app/shared/models/topics/topic';
import { Group } from 'app/shared/models/users/group';
import { PersonalNote } from 'app/shared/models/users/personal-note';
import { User } from 'app/shared/models/users/user';

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
     * Stores the to create the socket created using {@link WebsocketService}.
     */
    private socket;

    /**
     * Constructor to create the AutoupdateService. Calls the constructor of the parent class.
     * @param websocketService
     */
    constructor(private websocketService: WebsocketService) {
        super();
    }

    /**
     * Function to start the automatic update process
     * will build up a websocket connection using {@link WebsocketService}
     */
    startAutoupdate(): void {
        this.socket = this.websocketService.connect();
        this.socket.subscribe(response => {
            this.storeResponse(response);
        });
    }

    /**
     * Handle the answer of incoming data via {@link WebsocketService}.
     *
     * Detects the Class of an incomming model, creates a new empty object and assigns
     * the data to it using the deserialize function.
     *
     * Saves models in DataStore.
     */
    storeResponse(socketResponse): void {
        socketResponse.forEach(jsonObj => {
            const targetClass = this.getClassFromCollectionString(jsonObj.collection);
            if (jsonObj.action === 'deleted') {
                console.log('storeResponse detect delete');

                this.DS.remove(jsonObj.collection, jsonObj.id);
            } else {
                this.DS.add(new targetClass().deserialize(jsonObj.data));
            }
        });
    }

    /**
     * helper function to return the correct class from a collection string
     */
    getClassFromCollectionString(collection: string): any {
        switch (collection) {
            case 'core/projector': {
                return Projector;
            }
            case 'core/chat-message': {
                return ChatMessage;
            }
            case 'core/tag': {
                return Tag;
            }
            case 'core/projector-message': {
                return ProjectorMessage;
            }
            case 'core/countdown': {
                return Countdown;
            }
            case 'core/config': {
                return Config;
            }
            case 'users/user': {
                return User;
            }
            case 'users/group': {
                return Group;
            }
            case 'users/personal-note': {
                return PersonalNote;
            }
            case 'agenda/item': {
                return Item;
            }
            case 'topics/topic': {
                return Topic;
            }
            case 'motions/category': {
                return Category;
            }
            case 'motions/motion': {
                return Motion;
            }
            case 'motions/motion-block': {
                return MotionBlock;
            }
            case 'motions/workflow': {
                return Workflow;
            }
            case 'motions/motion-change-recommendation': {
                return MotionChangeReco;
            }
            case 'assignments/assignment': {
                return Assignment;
            }
            case 'mediafiles/mediafile': {
                return Mediafile;
            }
            default: {
                console.error('No rule for ', collection);
                break;
            }
        }
    }
}
