import { TranslateService } from '@ngx-translate/core';

import { ViewItem } from 'app/site/agenda/models/view-item';
import {
    AgendaListTitle,
    BaseViewModelWithAgendaItem,
    TitleInformationWithAgendaItem
} from 'app/site/base/base-view-model-with-agenda-item';
import { BaseModel, ModelConstructor } from '../../shared/models/base/base-model';
import { BaseRepository } from './base-repository';
import { CollectionStringMapperService } from '../core-services/collection-string-mapper.service';
import { DataSendService } from '../core-services/data-send.service';
import { DataStoreService } from '../core-services/data-store.service';
import { RelationManagerService } from '../core-services/relation-manager.service';
import { RelationDefinition } from '../definitions/relations';
import { ViewModelStoreService } from '../core-services/view-model-store.service';

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
    getAgendaListTitle: (titleInformation: T) => AgendaListTitle;
    getAgendaSlideTitle: (titleInformation: T) => string;
}

/**
 * The base repository for objects with an agenda item.
 */
export abstract class BaseIsAgendaItemContentObjectRepository<
        V extends BaseViewModelWithAgendaItem & T,
        M extends BaseModel,
        T extends TitleInformationWithAgendaItem
    >
    extends BaseRepository<V, M, T>
    implements IBaseIsAgendaItemContentObjectRepository<V, M, T> {
    public constructor(
        DS: DataStoreService,
        dataSend: DataSendService,
        collectionStringMapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        translate: TranslateService,
        relationManager: RelationManagerService,
        baseModelCtor: ModelConstructor<M>,
        relationDefinitions?: RelationDefinition[]
    ) {
        super(
            DS,
            dataSend,
            collectionStringMapperService,
            viewModelStoreService,
            translate,
            relationManager,
            baseModelCtor,
            relationDefinitions
        );
    }

    protected extendRelations(): void {
        this.relationDefinitions.push({
            type: 'M2O',
            ownIdKey: 'agenda_item_id',
            ownKey: 'item',
            foreignViewModel: ViewItem
        });
    }

    /**
     * @returns the agenda title for the agenda item list. Should
     * be `<item number> · <title> (<type>)`. E.g. `7 · the is an election (Election)`.
     */
    public getAgendaListTitle(titleInformation: T): AgendaListTitle {
        // Return the agenda title with the model's verbose name appended
        let numberPrefix = '';
        if (titleInformation.agenda_item_number && titleInformation.agenda_item_number()) {
            numberPrefix = `${titleInformation.agenda_item_number()} · `;
        }

        const title = `${numberPrefix}${this.getTitle(titleInformation)} (${this.getVerboseName()})`;
        return { title };
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
