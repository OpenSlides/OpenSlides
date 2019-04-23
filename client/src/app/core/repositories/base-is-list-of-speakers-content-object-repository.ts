import { TranslateService } from '@ngx-translate/core';

import { TitleInformation } from '../../site/base/base-view-model';
import { BaseModel, ModelConstructor } from '../../shared/models/base/base-model';
import { BaseRepository } from './base-repository';
import { DataStoreService } from '../core-services/data-store.service';
import { DataSendService } from '../core-services/data-send.service';
import { CollectionStringMapperService } from '../core-services/collection-string-mapper.service';
import { ViewModelStoreService } from '../core-services/view-model-store.service';
import { ListOfSpeakers } from 'app/shared/models/agenda/list-of-speakers';
import { BaseViewModelWithListOfSpeakers } from 'app/site/base/base-view-model-with-list-of-speakers';

export function isBaseIsListOfSpeakersContentObjectRepository(
    obj: any
): obj is BaseIsListOfSpeakersContentObjectRepository<any, any, any> {
    const repo = obj as BaseIsListOfSpeakersContentObjectRepository<any, any, any>;
    return !!obj && repo.getListOfSpeakersTitle !== undefined && repo.getListOfSpeakersSlideTitle !== undefined;
}

/**
 * Describes a base repository which objects have a list of speakers assigned.
 */
export interface IBaseIsListOfSpeakersContentObjectRepository<
    V extends BaseViewModelWithListOfSpeakers & T,
    M extends BaseModel,
    T extends TitleInformation
> extends BaseRepository<V, M, T> {
    getListOfSpeakersTitle: (titleInformation: T) => string;
    getListOfSpeakersSlideTitle: (titleInformation: T) => string;
}

/**
 * The base repository for objects with a list of speakers.
 */
export abstract class BaseIsListOfSpeakersContentObjectRepository<
    V extends BaseViewModelWithListOfSpeakers & T,
    M extends BaseModel,
    T extends TitleInformation
> extends BaseRepository<V, M, T> implements IBaseIsListOfSpeakersContentObjectRepository<V, M, T> {
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
        if (!this.depsModelCtors) {
            this.depsModelCtors = [];
        }
        this.depsModelCtors.push(ListOfSpeakers);
    }

    public getListOfSpeakersTitle(titleInformation: T): string {
        return this.getTitle(titleInformation) + ' (' + this.getVerboseName() + ')';
    }

    public getListOfSpeakersSlideTitle(titleInformation: T): string {
        return this.getTitle(titleInformation);
    }

    /**
     * Adds the list of speakers titles to the view model
     */
    protected createViewModelWithTitles(model: M): V {
        const viewModel = super.createViewModelWithTitles(model);
        viewModel.getListOfSpeakersTitle = () => this.getListOfSpeakersTitle(viewModel);
        viewModel.getListOfSpeakersSlideTitle = () => this.getListOfSpeakersSlideTitle(viewModel);
        return viewModel;
    }
}
