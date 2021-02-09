import { BaseModel } from '../base/base-model';

export class ChatMessage extends BaseModel<ChatMessage> {
    public static COLLECTIONSTRING = 'chat/chat-message';

    public id: number;
    public text: string;
    public username: string;
    /**
     * Note: Do not expect, that this user is known in the client.
     * Use this id just as a numerical value.
     */
    public user_id: number;
    public timestamp: string;
    public chatgroup_id: number;

    private _timestampAsDate: Date;
    public get timestampAsDate(): Date {
        return this._timestampAsDate;
    }

    public constructor(input?: any) {
        super(ChatMessage.COLLECTIONSTRING, input);
        this._timestampAsDate = new Date(this.timestamp);
    }
}
