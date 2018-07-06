import { Injectable } from '@angular/core';
import { BaseComponent } from 'app/base.component';
import { WebsocketService } from './websocket.service';

import { BaseModel } from 'app/core/models/baseModel';
import { Item } from 'app/core/models/agenda/item';
import { Assignment } from 'app/core/models/assignments/assignment';
import { ChatMessage } from 'app/core/models/core/chat-message';
import { Config } from 'app/core/models/core/config';
import { Countdown } from 'app/core/models/core/countdown';
import { ProjectorMessage } from 'app/core/models/core/projector-message';
import { Projector } from 'app/core/models/core/projector';
import { Tag } from 'app/core/models/core/tag';
import { Mediafile } from 'app/core/models/mediafiles/mediafile';
import { Category } from 'app/core/models/motions/category';
import { MotionBlock } from 'app/core/models/motions/motion-block';
import { MotionChangeReco } from 'app/core/models/motions/motion-change-reco';
import { Motion } from 'app/core/models/motions/motion';
import { Workflow } from 'app/core/models/motions/workflow';
import { Topic } from 'app/core/models/topics/topic';
import { Group } from 'app/core/models/users/group';
import { PersonalNote } from 'app/core/models/users/personal-note';
import { User } from 'app/core/models/users/user';

/**
 * Basically handles the inital update and all automatic updates.
 */

@Injectable({
    providedIn: 'root'
})
export class AutoupdateService extends BaseComponent {
    private socket;

    constructor(private websocketService: WebsocketService) {
        super();
    }

    // initialte autpupdate Service
    startAutoupdate(): void {
        console.log('start autoupdate');
        this.socket = this.websocketService.connect();
        this.socket.subscribe(response => {
            this.storeResponse(response);
        });
    }

    // create models out of socket answer
    storeResponse(socketResponse): void {
        socketResponse.forEach(model => {
            switch (model.collection) {
                case 'core/projector': {
                    this.DS.add(BaseModel.fromJSON(model.data, Projector));
                    break;
                }
                case 'core/chat-message': {
                    this.DS.add(BaseModel.fromJSON(model.data, ChatMessage));
                    break;
                }
                case 'core/tag': {
                    this.DS.add(BaseModel.fromJSON(model.data, Tag));
                    break;
                }
                case 'core/projector-message': {
                    this.DS.add(BaseModel.fromJSON(model.data, ProjectorMessage));
                    break;
                }
                case 'core/countdown': {
                    this.DS.add(BaseModel.fromJSON(model.data, Countdown));
                    break;
                }
                case 'core/config': {
                    this.DS.add(BaseModel.fromJSON(model.data, Config));
                    break;
                }
                case 'users/user': {
                    this.DS.add(BaseModel.fromJSON(model.data, User));
                    break;
                }
                case 'users/group': {
                    this.DS.add(BaseModel.fromJSON(model.data, Group));
                    break;
                }
                case 'users/personal-note': {
                    this.DS.add(BaseModel.fromJSON(model.data, PersonalNote));
                    break;
                }
                case 'agenda/item': {
                    this.DS.add(BaseModel.fromJSON(model.data, Item));
                    break;
                }
                case 'topics/topic': {
                    this.DS.add(BaseModel.fromJSON(model.data, Topic));
                    break;
                }
                case 'motions/category': {
                    this.DS.add(BaseModel.fromJSON(model.data, Category));
                    break;
                }
                case 'motions/motion': {
                    this.DS.add(BaseModel.fromJSON(model.data, Motion));
                    break;
                }
                case 'motions/motion-block': {
                    this.DS.add(BaseModel.fromJSON(model.data, MotionBlock));
                    break;
                }
                case 'motions/workflow': {
                    this.DS.add(BaseModel.fromJSON(model.data, Workflow));
                    break;
                }
                case 'motions/motion-change-recommendation': {
                    this.DS.add(BaseModel.fromJSON(model.data, MotionChangeReco));
                    break;
                }
                case 'assignments/assignment': {
                    this.DS.add(BaseModel.fromJSON(model.data, Assignment));
                    break;
                }
                case 'mediafiles/mediafile': {
                    this.DS.add(BaseModel.fromJSON(model.data, Mediafile));
                    break;
                }
                default: {
                    console.error('No rule for ', model.collection, '\n object was: ', model);
                    break;
                }
            }
        });
    }
}
