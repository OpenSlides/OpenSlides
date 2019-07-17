import { TranslateService } from '@ngx-translate/core';

import { BaseModel, ModelConstructor } from '../../shared/models/base/base-model';
import { CollectionStringMapperService } from '../core-services/collection-string-mapper.service';
import { DataSendService } from '../core-services/data-send.service';
import { BaseRepository, RelationDefinition } from './base-repository';
import { DataStoreService } from '../core-services/data-store.service';
import { ViewModelStoreService } from '../core-services/view-model-store.service';
import {
    TitleInformationWithAgendaItem,
    BaseViewModelWithAgendaItem
} from 'app/site/base/base-view-model-with-agenda-item';
import { ViewItem } from 'app/site/agenda/models/view-item';

export function isBaseIsAgendaItemContentObjectRepository(
    obj: any
): obj is BaseIsAgendaItemContentObjectRepository<any, any, any> {
    const repo = obj as BaseIsAgendaItemContentObjectRepository<any, any, any>;
    return !!obj && repo.getAgendaSlideTitle !== undefined && repo.getAgendaListTitle !== undefined;
}

/**
 * Describes a base repository which objects do have an assigned agenda item.
 */
export interface IBaseIsAgendaItemContentObjectRepository<
    V extends BaseViewModelWithAgendaItem & T,
    M extends BaseModel,
    T extends TitleInformationWithAgendaItem
> extends BaseRepository<V, M, T> {
    getAgendaListTitle: (titleInformation: T) => string;
    getAgendaSlideTitle: (titleInformation: T) => string;
}

/**
 * The base repository for objects with an agenda item.
 */
export abstract class BaseIsAgendaItemContentObjectRepository<
    V extends BaseViewModelWithAgendaItem & T,
    M extends BaseModel,
    T extends TitleInformationWithAgendaItem
> extends BaseRepository<V, M, T> implements IBaseIsAgendaItemContentObjectRepository<V, M, T> {
    public constructor(
        DS: DataStoreService,
        dataSend: DataSendService,
        collectionStringMapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        translate: TranslateService,
        baseModelCtor: ModelConstructor<M>,
        relationDefinitions?: RelationDefinition[]
    ) {
        super(
            DS,
            dataSend,
            collectionStringMapperService,
            viewModelStoreService,
            translate,
            baseModelCtor,
            relationDefinitions
        );
    }

    protected groupRelationsByCollections(): void {
        this.relationDefinitions.push({
            type: 'O2M',
            ownIdKey: 'agenda_item_id',
            ownKey: 'item',
            foreignModel: ViewItem
        });
        super.groupRelationsByCollections();
    }

    /**
     * @returns the agenda title for the agenda item list. Should
     * be `<item number> · <title> (<type>)`. E.g. `7 · the is an election (Election)`.
     */
    public getAgendaListTitle(titleInformation: T): string {
        // Return the agenda title with the model's verbose name appended
        const numberPrefix = titleInformation.agenda_item_number ? `${titleInformation.agenda_item_number} · ` : '';
        return numberPrefix + this.getTitle(titleInformation) + ' (' + this.getVerboseName() + ')';
    }

    /**
     * @returns the agenda title for the item slides
     */
    public getAgendaSlideTitle(titleInformation: T): string {
        return this.getTitle(titleInformation);
    }

    /**
     * Adds the agenda titles to the viewmodel.
     */
    protected createViewModelWithTitles(model: M): V {
        const viewModel = super.createViewModelWithTitles(model);
        viewModel.getAgendaListTitle = () => this.getAgendaListTitle(viewModel);
        viewModel.getAgendaSlideTitle = () => this.getAgendaSlideTitle(viewModel);
        return viewModel;
    }
}
