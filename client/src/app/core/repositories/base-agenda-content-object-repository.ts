import { BaseViewModel } from '../../site/base/base-view-model';
import { BaseModel, ModelConstructor } from '../../shared/models/base/base-model';
import { CollectionStringMapperService } from '../core-services/collectionStringMapper.service';
import { DataStoreService } from '../core-services/data-store.service';
import { ViewModelStoreService } from '../core-services/view-model-store.service';
import { BaseRepository } from './base-repository';

export function isBaseAgendaContentObjectRepository(obj: any): obj is BaseAgendaContentObjectRepository<any, any> {
    const repo = obj as BaseAgendaContentObjectRepository<any, any>;
    return (
        !!obj &&
        repo.getVerboseName !== undefined &&
        repo.getAgendaTitle !== undefined &&
        repo.getAgendaTitleWithType !== undefined
    );
}

export abstract class BaseAgendaContentObjectRepository<
    V extends BaseViewModel,
    M extends BaseModel
> extends BaseRepository<V, M> {
    public abstract getAgendaTitle: (model: Partial<M> | Partial<V>) => string;
    public abstract getAgendaTitleWithType: (model: Partial<M> | Partial<V>) => string;
    public abstract getVerboseName: (plural?: boolean) => string;

    /**
     */
    public constructor(
        DS: DataStoreService,
        collectionStringMapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        baseModelCtor: ModelConstructor<M>,
        depsModelCtors?: ModelConstructor<BaseModel>[]
    ) {
        super(DS, collectionStringMapperService, viewModelStoreService, baseModelCtor, depsModelCtors);
    }
}
