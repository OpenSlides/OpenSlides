import { BaseModel } from '../base/base-model';

export class ChatMessage extends BaseModel<ChatMessage> {
    public static COLLECTIONSTRING = 'chat/chat-message';

    public id: number;
    public text: string;
    public username: string;
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
