import { BaseModel } from '../base.model';
import { User } from '../users/user';

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

    public constructor(input?: any) {
        super();
        this._collectionString = 'core/chat-message';
        if (input) {
            this.deserialize(input);
        }
    }

    public getUser(): User {
        return this.DS.get<User>('users/user', this.user_id);
    }
}

BaseModel.registerCollectionElement('core/chat-message', ChatMessage);
