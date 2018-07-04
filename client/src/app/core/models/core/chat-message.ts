import { BaseModel } from 'app/core/models/baseModel';

export class ChatMessage extends BaseModel {
    static collectionString = 'core/chat-message';
    id: number;
    message: string;
    timestamp: string; // TODO: Type for timestamp
    user_id: number;

    constructor(id: number, message?: string, timestamp?: string, user_id?: number) {
        super(id);
        this.message = message;
        this.timestamp = timestamp;
    }

    public getCollectionString(): string {
        return ChatMessage.collectionString;
    }
}
