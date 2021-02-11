import { BaseModel } from '../base/base-model';

export class ChatGroup extends BaseModel<ChatGroup> {
    public static COLLECTIONSTRING = 'chat/chat-group';

    public id: number;
    public name: string;
    public access_groups_id: number[];

    public constructor(input?: any) {
        super(ChatGroup.COLLECTIONSTRING, input);
    }
}
