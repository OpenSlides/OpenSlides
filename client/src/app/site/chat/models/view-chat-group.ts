import { ChatGroup } from 'app/shared/models/chat/chat-group';
import { BaseViewModel } from '../../base/base-view-model';
import { ViewGroup } from '../../users/models/view-group';

export interface ChatGroupTitleInformation {
    name: string;
}

export class ViewChatGroup extends BaseViewModel<ChatGroup> implements ChatGroupTitleInformation {
    public static COLLECTIONSTRING = ChatGroup.COLLECTIONSTRING;
    protected _collectionString = ChatGroup.COLLECTIONSTRING;

    public get chatGroup(): ChatGroup {
        return this._model;
    }
}
export interface ViewChatGroup extends ChatGroup {
    read_groups: ViewGroup[];
    write_groups: ViewGroup[];
}
