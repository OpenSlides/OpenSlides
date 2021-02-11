import { Component, EventEmitter, Input, Output } from '@angular/core';

import { OperatorService, Permission } from 'app/core/core-services/operator.service';
import { ViewChatMessage } from '../../models/view-chat-message';

@Component({
    selector: 'os-chat-message',
    templateUrl: './chat-message.component.html',
    styleUrls: ['./chat-message.component.scss']
})
export class ChatMessageComponent {
    @Input() private message: ViewChatMessage;

    @Output() public deleteEvent = new EventEmitter();

    public get isOwnMessage(): boolean {
        return this.operator?.user?.id === this.message?.user_id || false;
    }

    public get canDelete(): boolean {
        return this.isOwnMessage || this.operator.hasPerms(Permission.chatCanManage);
    }

    public get author(): string {
        return this.message?.username || '';
    }

    public get text(): string {
        return this.message?.text || '';
    }

    public get date(): Date {
        return this.message?.timestampAsDate || undefined;
    }

    public constructor(private operator: OperatorService) {}

    public onDeleteMessage(): void {
        this.deleteEvent.next();
    }
}
