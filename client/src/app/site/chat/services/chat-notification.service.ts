import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable } from 'rxjs';

import { ViewChatMessage } from 'app/site/chat/models/view-chat-message';
import { ChatMessageRepositoryService } from '../../../core/repositories/chat/chat-message-repository.service';
import { StorageService } from '../../../core/core-services/storage.service';

interface LastMessageTimestampsSeen {
    [chatgroupId: number]: Date;
}
interface StorageLastMessageTimestampsSeen {
    [chatgroupId: number]: string;
}
function isStorageLastMessageTimestampsSeen(obj: any): obj is StorageLastMessageTimestampsSeen {
    if (!obj || typeof obj !== 'object') {
        return false;
    }
    const _obj = obj as object;
    return Object.keys(_obj).every(id => {
        return +id > 0 && new Date(_obj[id]).getTime() !== NaN;
    });
}

export interface NotificationAmount {
    [chatgroupId: number]: number; // the amount of notifications per chat group.
}

const STORAGE_KEY = 'chat-notifications';

@Injectable({
    providedIn: 'root'
})
export class ChatNotificationService {
    private chatgroupNotifications = new BehaviorSubject<NotificationAmount>({});

    public get chatgroupNotificationsObservable(): Observable<NotificationAmount> {
        return this.chatgroupNotifications.asObservable();
    }

    private lastMessageTimestampSeen: LastMessageTimestampsSeen = {};
    private oldMessageLength = 0;
    private openChatgroupIds: number[] = [];

    public constructor(private repo: ChatMessageRepositoryService, private storage: StorageService) {
        this.storage.addNoClearKey(STORAGE_KEY);
        this.setup();
    }

    private async setup(): Promise<void> {
        await this.loadFromStorage();
        this.repo.getViewModelListBehaviorSubject().subscribe(messages => {
            if (messages && messages.length !== this.oldMessageLength) {
                this.processChatMessageUpdate(messages);
                this.oldMessageLength = messages.length;
            }
        });
    }

    private async loadFromStorage(): Promise<void> {
        const lastTimestamps = await this.storage.get(STORAGE_KEY);
        if (isStorageLastMessageTimestampsSeen(lastTimestamps)) {
            Object.keys(lastTimestamps).forEach(id => {
                this.lastMessageTimestampSeen[+id] = new Date(lastTimestamps[id]);
            });
        }
    }

    private processChatMessageUpdate(messages: ViewChatMessage[]): void {
        const notifications: NotificationAmount = {};
        messages.forEach(message => {
            const lastTimestamp = this.lastMessageTimestampSeen[message.chatgroup_id];
            if (
                !this.openChatgroupIds.includes(message.chatgroup_id) &&
                (!lastTimestamp || lastTimestamp < message.timestampAsDate)
            ) {
                notifications[message.chatgroup_id] = (notifications[message.chatgroup_id] || 0) + 1;
            }
        });
        this.chatgroupNotifications.next(notifications);
    }

    public openChat(chatgroupId: number): void {
        this.openChatgroupIds.push(chatgroupId);

        // clear notification
        this.lastMessageTimestampSeen[chatgroupId] = new Date(); // set surrent date as new seen.
        this.saveToStorage();

        // mute notifications locally
        const currentNotificationAmounts = this.chatgroupNotifications.getValue();
        currentNotificationAmounts[chatgroupId] = 0;
        this.chatgroupNotifications.next(currentNotificationAmounts);
    }

    public closeChat(chatgroupId: number): void {
        // clear notification
        this.lastMessageTimestampSeen[chatgroupId] = new Date(); // set surrent date as new seen.
        this.saveToStorage();

        // unmute notifications locally
        this.openChatgroupIds = this.openChatgroupIds.filter(id => id !== chatgroupId);
    }

    private saveToStorage(): void {
        const lastSeen: StorageLastMessageTimestampsSeen = {};
        Object.keys(this.lastMessageTimestampSeen).forEach(id => {
            lastSeen[id] = this.lastMessageTimestampSeen[+id].toISOString();
        });
        this.storage.set(STORAGE_KEY, lastSeen);
    }
}
