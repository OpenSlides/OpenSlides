import { Injectable } from '@angular/core';
import { DataSendService } from '../../core-services/data-send.service';
import { DataStoreService } from '../../core-services/data-store.service';
import { BaseRepository } from '../base-repository';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { CollectionStringMapperService } from '../../core-services/collectionStringMapper.service';
import { ViewCountdown } from 'app/site/projector/models/view-countdown';
import { Countdown } from 'app/shared/models/core/countdown';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';

@Injectable({
    providedIn: 'root'
})
export class CountdownRepositoryService extends BaseRepository<ViewCountdown, Countdown> {
    public constructor(
        DS: DataStoreService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        private dataSend: DataSendService
    ) {
        super(DS, mapperService, viewModelStoreService, Countdown);
    }

    protected createViewModel(countdown: Countdown): ViewCountdown {
        return new ViewCountdown(countdown);
    }

    public async create(countdown: Countdown): Promise<Identifiable> {
        return await this.dataSend.createModel(countdown);
    }

    public async update(countdown: Partial<Countdown>, viewCountdown: ViewCountdown): Promise<void> {
        const update = viewCountdown.countdown;
        update.patchValues(countdown);
        await this.dataSend.updateModel(update);
    }

    public async delete(viewCountdown: ViewCountdown): Promise<void> {
        await this.dataSend.deleteModel(viewCountdown.countdown);
    }
}
