import { ChatMessage } from 'app/shared/models/core/chat-message';
import { BaseViewModel } from 'app/site/base/base-view-model';

export class ViewChatMessage extends BaseViewModel {
    private _message: ChatMessage;

    public get chatmessage(): ChatMessage {
        return this._message ? this._message : null;
    }

    public get id(): number {
        return this.chatmessage ? this.chatmessage.id : null;
    }

    public get message(): string {
        return this.chatmessage ? this.chatmessage.message : null;
    }

    public constructor(message?: ChatMessage) {
        super();
        this._message = message;
    }

    public getTitle(): string {
        return 'Chatmessage';
    }

    public updateValues(message: ChatMessage): void {
        console.log('Update message TODO with vals:', message);
    }
}
