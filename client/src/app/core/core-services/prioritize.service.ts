import { Injectable } from '@angular/core';

import { ConstantsService } from './constants.service';
import { DataStoreService } from './data-store.service';
import { OpenSlidesStatusService } from './openslides-status.service';
import { OperatorService } from './operator.service';
import { WebsocketService } from './websocket.service';

interface OpenSlidesSettings {
    PRIORITIZED_GROUP_IDS?: number[];
}

/**
 * Cares about prioritizing a client. Checks, if the operator is in one of
 * some prioritized groups. These group ids come from the server. If the prio-
 * ritization changes, the websocket connection gets reconnected.
 */
@Injectable({
    providedIn: 'root'
})
export class PrioritizeService {
    private prioritizedGroupIds: number[] = [];

    public constructor(
        constantsService: ConstantsService,
        private websocketService: WebsocketService,
        private DS: DataStoreService,
        private openSlidesStatusService: OpenSlidesStatusService,
        private operator: OperatorService
    ) {
        constantsService.get<OpenSlidesSettings>('Settings').subscribe(settings => {
            this.prioritizedGroupIds = settings.PRIORITIZED_GROUP_IDS || [];
            this.checkPrioritization();
        });
        operator.getUserObservable().subscribe(() => this.checkPrioritization());
    }

    private checkPrioritization(): void {
        const opPrioritized = this.operator.isInGroupIdsNonAdminCheck(...this.prioritizedGroupIds);
        if (this.openSlidesStatusService.isPrioritizedClient !== opPrioritized) {
            console.log('Alter prioritization:', opPrioritized);
            this.openSlidesStatusService.isPrioritizedClient = opPrioritized;
            this.websocketService.reconnect(this.DS.maxChangeId);
        }
    }
}
