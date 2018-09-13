import { BaseModel } from '../base.model';

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

    public toString(): string {
        return this.message;
    }
}

BaseModel.registerCollectionElement('core/chat-message', ChatMessage);
