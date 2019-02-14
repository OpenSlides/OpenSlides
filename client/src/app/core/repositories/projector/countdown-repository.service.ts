import { Injectable } from '@angular/core';
import { DataSendService } from '../../core-services/data-send.service';
import { DataStoreService } from '../../core-services/data-store.service';
import { BaseRepository } from '../base-repository';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { CollectionStringMapperService } from '../../core-services/collectionStringMapper.service';
import { ViewCountdown } from 'app/site/projector/models/view-countdown';
import { Countdown } from 'app/shared/models/core/countdown';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { TranslateService } from '@ngx-translate/core';
import { ServertimeService } from 'app/core/core-services/servertime.service';

@Injectable({
    providedIn: 'root'
})
export class CountdownRepositoryService extends BaseRepository<ViewCountdown, Countdown> {
    public constructor(
        DS: DataStoreService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        private dataSend: DataSendService,
        private translate: TranslateService,
        private servertimeService: ServertimeService
    ) {
        super(DS, mapperService, viewModelStoreService, Countdown);
    }

    protected createViewModel(countdown: Countdown): ViewCountdown {
        const viewCountdown = new ViewCountdown(countdown);
        viewCountdown.getVerboseName = (plural: boolean = false) => {
            return this.translate.instant(plural ? 'Countdowns' : 'Countdown');
        };
        return viewCountdown;
    }

    public async create(countdown: Countdown): Promise<Identifiable> {
        return await this.dataSend.createModel(countdown);
    }

    public async update(countdown: Partial<Countdown>, viewCountdown: ViewCountdown): Promise<void> {
        const update = viewCountdown.countdown;
        update.patchValues(countdown);
        await this.dataSend.updateModel(update);
    }

    public async delete(countdown: ViewCountdown): Promise<void> {
        await this.dataSend.deleteModel(countdown.countdown);
    }

    public async start(countdown: ViewCountdown): Promise<void> {
        const endTime = this.servertimeService.getServertime() / 1000 + countdown.countdown_time;
        await this.update({ running: true, countdown_time: endTime }, countdown);
    }

    public async stop(countdown: ViewCountdown): Promise<void> {
        await this.update({ running: false, countdown_time: countdown.default_time }, countdown);
    }

    public async pause(countdown: ViewCountdown): Promise<void> {
        const endTime = countdown.countdown_time - this.servertimeService.getServertime() / 1000;
        await this.update({ running: false, countdown_time: endTime }, countdown);
    }
}
