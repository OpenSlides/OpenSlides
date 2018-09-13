import { BaseModel } from '../base.model';
import { User } from '../users/user';

/**
 * Representation of chat messages.
 * @ignore
 */
export class ChatMessage extends BaseModel {
    public id: number;
    public message: string;
    public timestamp: string; // TODO: Type for timestamp
    public user_id: number;

    public constructor(input?: any) {
        super('core/chat-message', input);
    }

    public getUser(): User {
        return this.DS.get<User>('users/user', this.user_id);
    }

    public toString(): string {
        return this.message;
    }
}

BaseModel.registerCollectionElement('core/chat-message', ChatMessage);
