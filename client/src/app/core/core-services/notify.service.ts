import { Injectable } from '@angular/core';

import { Observable, Subject } from 'rxjs';

import { OperatorService } from './operator.service';
import { WebsocketService } from './websocket.service';

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
    content: T;
}

/**
 * This interface has all fields for a notify request to the server. Next to name and content
 * one can give an array of user ids (or the value `true` for all users) and an array of
 * channel names.
 */
export interface NotifyRequest<T> extends NotifyBase<T> {
    /**
     * User ids (or `true` for all users) to send this message to.
     */
    users?: number[] | boolean;

    /**
     * An array of channels to send this message to.
     */
    replyChannels?: string[];
}

/**
 * This is the notify-format one recieves from the server.
 */
export interface NotifyResponse<T> extends NotifyBase<T> {
    /**
     * This is the channel name of the one, who sends this message. Can be use to directly
     * answer this message.
     */
    senderChannelName: string;

    /**
     * The user id of the user who sends this message. It is 0 for Anonymous.
     */
    senderUserId: number;

    /**
     * This is validated here and is true, if the senderUserId matches the current operator's id.
     * It's also true, if one recieves a request from an anonymous and the operator itself is the anonymous.
     */
    sendByThisUser: boolean;
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

    /**
     * Constructor to create the NotifyService. Registers itself to the WebsocketService.
     * @param websocketService
     */
    public constructor(private websocketService: WebsocketService, private operator: OperatorService) {
        websocketService.getOberservable<NotifyResponse<any>>('notify').subscribe(notify => {
            notify.sendByThisUser = notify.senderUserId === (this.operator.user ? this.operator.user.id : 0);
            this.notifySubject.next(notify);
            if (this.messageSubjects[notify.name]) {
                this.messageSubjects[notify.name].next(notify);
            }
        });
    }

    /**
     * Sents a notify message to all users (so all clients that are online).
     * @param name The name of the notify message
     * @param content The payload to send
     */
    public sendToAllUsers<T>(name: string, content: T): void {
        this.send(name, content);
    }

    /**
     * Sends a notify message to all open clients with the given users logged in.
     * @param name The name of th enotify message
     * @param content The payload to send.
     * @param users Multiple user ids.
     */
    public sendToUsers<T>(name: string, content: T, ...users: number[]): void {
        this.send(name, content, users);
    }

    /**
     * Sends a notify message to all given channels.
     * @param name The name of th enotify message
     * @param content The payload to send.
     * @param channels Multiple channels to send this message to.
     */
    public sendToChannels<T>(name: string, content: T, ...channels: string[]): void {
        if (channels.length < 1) {
            throw new Error('You have to provide at least one channel');
        }
        this.send(name, content, null, channels);
    }

    /**
     * General send function for notify messages.
     * @param name The name of the notify message
     * @param content The payload to send.
     * @param users Either an array of IDs or `true` meaning of sending this message to all online users clients.
     * @param channels An array of channels to send this message to.
     */
    public send<T>(name: string, content: T, users?: number[] | boolean, channels?: string[]): void {
        const notify: NotifyRequest<T> = {
            name: name,
            content: content
        };
        if (typeof users === 'boolean' && users !== true) {
            throw new Error('You just can give true as a boolean to send this message to all users.');
        }
        if (users !== null) {
            notify.users = users;
        }
        if (channels !== null) {
            notify.replyChannels = channels;
        }
        this.websocketService.send('notify', notify);
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
