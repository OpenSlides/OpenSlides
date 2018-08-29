import { Injectable } from '@angular/core';

import { OpenSlidesComponent } from 'app/openslides.component';
import { WebsocketService } from './websocket.service';

interface NotifyFormat {
    id: number; // Dummy
}

/**
 * Handles all incoming and outgoing notify messages via {@link WebsocketService}.
 */
@Injectable({
    providedIn: 'root'
})
export class NotifyService extends OpenSlidesComponent {
    /**
     * Constructor to create the NotifyService. Registers itself to the WebsocketService.
     * @param websocketService
     */
    public constructor(private websocketService: WebsocketService) {
        super();
        websocketService.getOberservable<any>('notify').subscribe(notify => {
            this.receive(notify);
        });
    }

    // TODO: Implement this
    private receive(notify: NotifyFormat): void {
        console.log('recv', notify);
        // TODO: Use a Subject, so one can subscribe and get notifies.
    }

    // TODO: Make this api better: e.g. send(data, users?, projectors?, channel?, ...)
    /**
     * Sents a notify object to the server
     * @param notify the notify objects
     */
    public send(notify: NotifyFormat): void {
        this.websocketService.send('notify', notify);
    }
}
