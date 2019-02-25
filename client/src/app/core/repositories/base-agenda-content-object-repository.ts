import { TranslateService } from '@ngx-translate/core';

import { BaseViewModel } from '../../site/base/base-view-model';
import { BaseModel, ModelConstructor } from '../../shared/models/base/base-model';
import { CollectionStringMapperService } from '../core-services/collectionStringMapper.service';
import { DataSendService } from '../core-services/data-send.service';
import { DataStoreService } from '../core-services/data-store.service';
import { ViewModelStoreService } from '../core-services/view-model-store.service';
import { BaseRepository } from './base-repository';

export function isBaseAgendaContentObjectRepository(obj: any): obj is BaseAgendaContentObjectRepository<any, any> {
    const repo = obj as BaseAgendaContentObjectRepository<any, any>;
    return !!obj && repo.getAgendaTitle !== undefined && repo.getAgendaTitleWithType !== undefined;
}

export abstract class BaseAgendaContentObjectRepository<
    V extends BaseViewModel,
    M extends BaseModel
> extends BaseRepository<V, M> {
    public abstract getAgendaTitle: (model: Partial<M> | Partial<V>) => string;
    public abstract getAgendaTitleWithType: (model: Partial<M> | Partial<V>) => string;

    /**
     */
    public constructor(
        DS: DataStoreService,
        dataSend: DataSendService,
        collectionStringMapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        translate: TranslateService,
        baseModelCtor: ModelConstructor<M>,
        depsModelCtors?: ModelConstructor<BaseModel>[]
    ) {
        super(
            DS,
            dataSend,
            collectionStringMapperService,
            viewModelStoreService,
            translate,
            baseModelCtor,
            depsModelCtors
        );
    }
}
