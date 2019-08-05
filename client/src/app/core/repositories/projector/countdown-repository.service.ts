import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { RelationManagerService } from 'app/core/core-services/relation-manager.service';
import { ServertimeService } from 'app/core/core-services/servertime.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { Countdown } from 'app/shared/models/core/countdown';
import { CountdownTitleInformation, ViewCountdown } from 'app/site/projector/models/view-countdown';
import { BaseRepository } from '../base-repository';
import { CollectionStringMapperService } from '../../core-services/collection-string-mapper.service';
import { DataSendService } from '../../core-services/data-send.service';
import { DataStoreService } from '../../core-services/data-store.service';

@Injectable({
    providedIn: 'root'
})
export class CountdownRepositoryService extends BaseRepository<ViewCountdown, Countdown, CountdownTitleInformation> {
    public constructor(
        DS: DataStoreService,
        dataSend: DataSendService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        translate: TranslateService,
        relationManager: RelationManagerService,
        private servertimeService: ServertimeService
    ) {
        super(DS, dataSend, mapperService, viewModelStoreService, translate, relationManager, Countdown);
    }

    public getTitle = (titleInformation: CountdownTitleInformation) => {
        return titleInformation.description
            ? `${titleInformation.title} (${titleInformation.description})`
            : titleInformation.title;
    };

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Countdowns' : 'Countdown');
    };

    /**
     * Starts a countdown.
     *
     * @param countdown The countdown to start.
     */
    public async start(countdown: ViewCountdown): Promise<void> {
        const endTime = this.servertimeService.getServertime() / 1000 + countdown.countdown_time;
        await this.update({ running: true, countdown_time: endTime }, countdown);
    }

    /**
     * Stops (former `reset`) a countdown. Sets the countdown time to the default time. If
     * this should not happen, use `pause()`.
     *
     * @param countdown The countdown to stop.
     */
    public async stop(countdown: ViewCountdown): Promise<void> {
        await this.update({ running: false, countdown_time: countdown.default_time }, countdown);
    }

    /**
     * Pauses the countdown. The remaining time will stay.
     *
     * @param countdown The countdown to pause.
     */
    public async pause(countdown: ViewCountdown): Promise<void> {
        const endTime = countdown.countdown_time - this.servertimeService.getServertime() / 1000;
        await this.update({ running: false, countdown_time: endTime }, countdown);
    }
}
