import { ChatMessage } from 'app/shared/models/chat/chat-message';
import { BaseViewModel } from '../../base/base-view-model';
import { ViewChatGroup } from './view-chat-group';

export interface ChatMessageTitleInformation {}

export class ViewChatMessage extends BaseViewModel<ChatMessage> implements ChatMessageTitleInformation {
    public static COLLECTIONSTRING = ChatMessage.COLLECTIONSTRING;
    protected _collectionString = ChatMessage.COLLECTIONSTRING;

    public get chatMessage(): ChatMessage {
        return this._model;
    }
}
export interface ViewChatMessage extends ChatMessage {
    chatgroup: ViewChatGroup;
}
