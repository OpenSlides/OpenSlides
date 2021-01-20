import { Injectable } from '@angular/core';

import { Observable, Subject } from 'rxjs';

import { CommunicationManagerService, OfflineError } from './communication-manager.service';
import { HttpService } from './http.service';
import { OperatorService } from './operator.service';

/**
 * Encapslates the name and content of every message regardless of being a request or response.
 */
interface NotifyBase<T> {
    /**
     * The name of the notify message.
     */
    name: string;

    /**
     * The content to send.
     */
    message: T;
}

function isNotifyBase(obj: object): obj is NotifyResponse<any> {
    const base = obj as NotifyBase<any>;
    return !!obj && base.message !== undefined && base.name !== undefined;
}

/**
 * This interface has all fields for a notify request to the server. Next to name and content
 * one can give an array of user ids (or the value `true` for all users) and an array of
 * channel names.
 */
export interface NotifyRequest<T> extends NotifyBase<T> {
    channel_id: string;
    to_all?: boolean;

    /**
     * User ids (or `true` for all users) to send this message to.
     */
    to_users?: number[];

    /**
     * An array of channels to send this message to.
     */
    to_channels?: string[];
}

/**
 * This is the notify-format one recieves from the server.
 */
export interface NotifyResponse<T> extends NotifyBase<T> {
    /**
     * This is the channel name of the one, who sends this message. Can be use to directly
     * answer this message.
     */
    sender_channel_id: string;

    /**
     * The user id of the user who sends this message. It is 0 for Anonymous.
     */
    sender_user_id: number;

    /**
     * This is validated here and is true, if the senderUserId matches the current operator's id.
     * It's also true, if one recieves a request from an anonymous and the operator itself is the anonymous.
     */
    sendByThisUser: boolean;
}

function isNotifyResponse(obj: object): obj is NotifyResponse<any> {
    const response = obj as NotifyResponse<any>;
    // Note: we do not test for sendByThisUser, since it is set later in our code.
    return isNotifyBase(obj) && response.sender_channel_id !== undefined && response.sender_user_id !== undefined;
}

interface ChannelIdResponse {
    channel_id: string;
}

function isChannelIdResponse(obj: object): obj is ChannelIdResponse {
    return !!obj && (obj as ChannelIdResponse).channel_id !== undefined;
}

/**
 * Handles all incoming and outgoing notify messages via {@link WebsocketService}.
 */
@Injectable({
    providedIn: 'root'
})
export class NotifyService {
    /**
     * A general subject for all messages.
     */
    private notifySubject = new Subject<NotifyResponse<any>>();

    /**
     * Subjects for specific messages.
     */
    private messageSubjects: {
        [name: string]: Subject<NotifyResponse<any>>;
    } = {};

    private channelId: string;

    public constructor(
        private communicationManager: CommunicationManagerService,
        private http: HttpService,
        private operator: OperatorService
    ) {
        this.communicationManager.startCommunicationEvent.subscribe(() => this.startListening());
        this.communicationManager.stopCommunicationEvent.subscribe(() => (this.channelId = null));
    }

    private async startListening(): Promise<void> {
        try {
            await this.communicationManager.subscribe<NotifyResponse<any> | ChannelIdResponse>(
                '/system/notify',
                notify => {
                    if (isChannelIdResponse(notify)) {
                        this.channelId = notify.channel_id;
                    } else if (isNotifyResponse(notify)) {
                        notify.sendByThisUser =
                            notify.sender_user_id === (this.operator.user ? this.operator.user.id : 0);
                        this.notifySubject.next(notify);
                        if (this.messageSubjects[notify.name]) {
                            this.messageSubjects[notify.name].next(notify);
                        }
                    } else {
                        console.error('Unknwon notify message', notify);
                    }
                }
            );
        } catch (e) {
            if (!(e instanceof OfflineError)) {
                console.error(e);
            }
        }
    }

    /**
     * Sents a notify message to all users (so all clients that are online).
     * @param name The name of the notify message
     * @param content The payload to send
     */
    public async sendToAllUsers<T>(name: string, content: T): Promise<void> {
        await this.send(name, content, true);
    }

    /**
     * Sends a notify message to all open clients with the given users logged in.
     * @param name The name of th enotify message
     * @param content The payload to send.
     * @param users Multiple user ids.
     */
    public async sendToUsers<T>(name: string, content: T, ...users: number[]): Promise<void> {
        if (users.length < 1) {
            throw new Error('You have to provide at least one user');
        }
        await this.send(name, content, false, users);
    }

    /**
     * Sends a notify message to all given channels.
     * @param name The name of th enotify message
     * @param content The payload to send.
     * @param channels Multiple channels to send this message to.
     */
    public async sendToChannels<T>(name: string, content: T, ...channels: string[]): Promise<void> {
        if (channels.length < 1) {
            throw new Error('You have to provide at least one channel');
        }
        await this.send(name, content, false, null, channels);
    }

    /**
     * General send function for notify messages.
     * @param name The name of the notify message
     * @param message The payload to send.
     * @param users Either an array of IDs or `true` meaning of sending this message to all online users clients.
     * @param channels An array of channels to send this message to.
     */
    private async send<T>(
        name: string,
        message: T,
        toAll?: boolean,
        users?: number[],
        channels?: string[]
    ): Promise<void> {
        if (!this.channelId) {
            throw new Error('No channel id!');
        }

        const notify: NotifyRequest<T> = {
            name: name,
            message: message,
            channel_id: this.channelId
        };
        if (toAll === true) {
            notify.to_all = true;
        }
        if (users) {
            notify.to_users = users;
        }
        if (channels) {
            notify.to_channels = channels;
        }

        console.debug('send notify', notify);
        await this.http.post<unknown>('/system/notify/send', notify);
    }

    /**
     * Returns a general observalbe of all notify messages.
     */
    public getObservable(): Observable<NotifyResponse<any>> {
        return this.notifySubject.asObservable();
    }

    /**
     * Returns an observable for a specific type of messages.
     * @param name The name of all messages to observe.
     */
    public getMessageObservable<T>(name: string): Observable<NotifyResponse<T>> {
        if (!this.messageSubjects[name]) {
            this.messageSubjects[name] = new Subject<NotifyResponse<any>>();
        }
        return this.messageSubjects[name].asObservable() as Observable<NotifyResponse<T>>;
    }
}
