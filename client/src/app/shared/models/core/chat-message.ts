import { BaseModel } from '../base.model';

/**
 * Representation of chat messages.
 * @ignore
 */
export class ChatMessage extends BaseModel {
    protected _collectionString: string;
    public id: number;
    public message: string;
    public timestamp: string; // TODO: Type for timestamp
    public user_id: number;

    public constructor(id?: number, message?: string, timestamp?: string, user_id?: number) {
        super();
        this._collectionString = 'core/chat-message';
        this.id = id;
        this.message = message;
        this.timestamp = timestamp;
        this.user_id = user_id;
    }

    public getUser(): BaseModel | BaseModel[] {
        return this.DS.get('users/user', this.user_id);
    }
}

BaseModel.registerCollectionElement('core/chat-message', ChatMessage);
