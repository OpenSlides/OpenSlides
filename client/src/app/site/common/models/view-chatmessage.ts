import { ChatMessage } from 'app/shared/models/core/chat-message';
import { BaseViewModel } from 'app/site/base/base-view-model';

export class ViewChatMessage extends BaseViewModel {
    private _chatMessage: ChatMessage;

    public get chatmessage(): ChatMessage {
        return this._chatMessage;
    }

    public get id(): number {
        return this.chatmessage.id;
    }

    public get message(): string {
        return this.chatmessage.message;
    }

    public constructor(message?: ChatMessage) {
        super('Chatmessage');
        this._chatMessage = message;
    }

    public getTitle(): string {
        return 'Chatmessage';
    }

    public updateDependencies(message: BaseViewModel): void {}
}
