import { Injectable } from '@angular/core';

import { BaseRepository } from '../../base/base-repository';
import { DataStoreService } from '../../../core/services/data-store.service';
import { Item } from '../../../shared/models/agenda/item';
import { ViewItem } from '../models/view-item';
import { AgendaBaseModel } from '../../../shared/models/base/agenda-base-model';
import { BaseModel } from '../../../shared/models/base/base-model';
import { Identifiable } from '../../../shared/models/base/identifiable';
import { CollectionStringModelMapperService } from '../../../core/services/collectionStringModelMapper.service';

/**
 * Repository service for users
 *
 * Documentation partially provided in {@link BaseRepository}
 */
@Injectable({
    providedIn: 'root'
})
export class AgendaRepositoryService extends BaseRepository<ViewItem, Item> {
    public constructor(DS: DataStoreService, mapperService: CollectionStringModelMapperService) {
        super(DS, mapperService, Item);
    }

    /**
     * Returns the corresponding content object to a given {@link Item} as an {@link AgendaBaseModel}
     * @param agendaItem
     */
    private getContentObject(agendaItem: Item): AgendaBaseModel {
        const contentObject = this.DS.get<BaseModel>(
            agendaItem.content_object.collection,
            agendaItem.content_object.id
        );
        if (!contentObject) {
            return null;
        }
        if (contentObject instanceof AgendaBaseModel) {
            return contentObject as AgendaBaseModel;
        } else {
            throw new Error(
                `The content object (${agendaItem.content_object.collection}, ${
                    agendaItem.content_object.id
                }) of item ${agendaItem.id} is not a BaseProjectableModel.`
            );
        }
    }

    /**
     * @ignore
     *
     * TODO: used over not-yet-existing detail view
     */
    public async update(item: Partial<Item>, viewUser: ViewItem): Promise<void> {
        return null;
    }

    /**
     * @ignore
     *
     * TODO: used over not-yet-existing detail view
     */
    public async delete(item: ViewItem): Promise<void> {
        return null;
    }

    /**
     * @ignore
     *
     * TODO: used over not-yet-existing detail view
     */
    public async create(item: Item): Promise<Identifiable> {
        return null;
    }

    public createViewModel(item: Item): ViewItem {
        const contentObject = this.getContentObject(item);

        return new ViewItem(item, contentObject);
    }
}
