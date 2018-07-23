import { BaseModel } from '../base.model';

/**
 * Representation of chat messages.
 * @ignore
 */
export class ChatMessage extends BaseModel {
    protected _collectionString: string;
    id: number;
    message: string;
    timestamp: string; // TODO: Type for timestamp
    user_id: number;

    constructor(id?: number, message?: string, timestamp?: string, user_id?: number) {
        super();
        this._collectionString = 'core/chat-message';
        this.id = id;
        this.message = message;
        this.timestamp = timestamp;
        this.user_id = user_id;
    }

    getUser(): BaseModel | BaseModel[] {
        return this.DS.get('users/user', this.user_id);
    }
}
