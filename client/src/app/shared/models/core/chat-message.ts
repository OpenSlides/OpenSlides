import { BaseModel } from '../base/base-model';

/**
 * Representation of chat messages.
 * @ignore
 */
export class ChatMessage extends BaseModel<ChatMessage> {
    public id: number;
    public message: string;
    public timestamp: string; // TODO: Type for timestamp
    public user_id: number;

    public constructor(input?: any) {
        super('core/chat-message', 'Chatmessage', input);
    }

    public getTitle(): string {
        return 'Chatmessage';
    }
}
