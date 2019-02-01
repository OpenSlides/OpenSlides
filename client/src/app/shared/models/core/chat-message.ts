import { BaseModel } from '../base/base-model';

/**
 * Representation of chat messages.
 * @ignore
 */
export class ChatMessage extends BaseModel<ChatMessage> {
    public static COLLECTIONSTRING = 'core/chat-message';
    public id: number;
    public message: string;
    public timestamp: string; // TODO: Type for timestamp
    public user_id: number;

    public constructor(input?: any) {
        super(ChatMessage.COLLECTIONSTRING, input);
    }
}
