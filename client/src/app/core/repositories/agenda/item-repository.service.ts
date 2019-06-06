import { Injectable } from '@angular/core';

import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { CollectionStringMapperService } from '../../core-services/collection-string-mapper.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { DataSendService } from 'app/core/core-services/data-send.service';
import { DataStoreService } from '../../core-services/data-store.service';
import { HttpService } from 'app/core/core-services/http.service';
import { Item } from 'app/shared/models/agenda/item';
import { TreeIdNode } from 'app/core/ui-services/tree.service';
import { ViewItem, ItemTitleInformation } from 'app/site/agenda/models/view-item';
import {
    BaseViewModelWithAgendaItem,
    isBaseViewModelWithAgendaItem
} from 'app/site/base/base-view-model-with-agenda-item';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { BaseViewModel } from 'app/site/base/base-view-model';
import { Motion } from 'app/shared/models/motions/motion';
import { MotionBlock } from 'app/shared/models/motions/motion-block';
import { Topic } from 'app/shared/models/topics/topic';
import { Assignment } from 'app/shared/models/assignments/assignment';
import { BaseIsAgendaItemContentObjectRepository } from '../base-is-agenda-item-content-object-repository';
import { BaseHasContentObjectRepository } from '../base-has-content-object-repository';

/**
 * Repository service for items
 *
 * Documentation partially provided in {@link BaseRepository}
 */
@Injectable({
    providedIn: 'root'
})
export class ItemRepositoryService extends BaseHasContentObjectRepository<
    ViewItem,
    Item,
    BaseViewModelWithAgendaItem,
    ItemTitleInformation
> {
    /**
     * Contructor for agenda repository.
     *
     * @param DS The DataStore
     * @param httpService OpenSlides own HttpService
     * @param mapperService OpenSlides mapping service for collection strings
     * @param config Read config variables
     * @param dataSend send models to the server
     * @param treeService sort the data according to weight and parents
     */
    public constructor(
        DS: DataStoreService,
        dataSend: DataSendService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        translate: TranslateService,
        private httpService: HttpService,
        private config: ConfigService
    ) {
        super(DS, dataSend, mapperService, viewModelStoreService, translate, Item, [
            Topic,
            Assignment,
            Motion,
            MotionBlock
        ]);

        this.setSortFunction((a, b) => a.weight - b.weight);
    }

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Items' : 'Item');
    };

    public getTitle = (titleInformation: ItemTitleInformation) => {
        if (titleInformation.contentObject) {
            return titleInformation.contentObject.getAgendaListTitle();
        } else {
            const repo = this.collectionStringMapperService.getRepository(
                titleInformation.contentObjectData.collection
            ) as BaseIsAgendaItemContentObjectRepository<any, any, any>;
            return repo.getAgendaListTitle(titleInformation.title_information);
        }
    };

    /**
     * Creates the viewItem out of a given item
     *
     * @param item the item that should be converted to view item
     * @returns a new view item
     */
    public createViewModel(item: Item): ViewItem {
        const contentObject = this.getContentObject(item);
        return new ViewItem(item, contentObject);
    }

    /**
     * Returns the corresponding content object to a given {@link Item} as an {@link BaseAgendaItemViewModel}
     *
     * @param agendaItem the target agenda Item
     * @returns the content object of the given item. Might be null if it was not found.
     */
    public getContentObject(agendaItem: Item): BaseViewModelWithAgendaItem {
        const contentObject = this.viewModelStoreService.get<BaseViewModel>(
            agendaItem.content_object.collection,
            agendaItem.content_object.id
        );
        if (!contentObject) {
            return null;
        }
        if (isBaseViewModelWithAgendaItem(contentObject)) {
            return contentObject;
        } else {
            throw new Error(
                `The content object (${agendaItem.content_object.collection}, ${
                    agendaItem.content_object.id
                }) of item ${agendaItem.id} is not a BaseAgendaItemViewModel.`
            );
        }
    }

    /**
     * Trigger the automatic numbering sequence on the server
     */
    public async autoNumbering(): Promise<void> {
        await this.httpService.post('/rest/agenda/item/numbering/');
    }

    /**
     * @ignore
     *
     * TODO: Usually, agenda items are deleted with their corresponding content object
     *       However, deleting an agenda item might be interpretet with "removing an item
     *       from the agenda" permanently. Usually, items might juse be hidden but not
     *       deleted (right now)
     */
    public async delete(item: ViewItem): Promise<void> {
        const restUrl = `/rest/${item.contentObject.collectionString}/${item.contentObject.id}/`;
        await this.httpService.delete(restUrl);
    }

    /**
     * TODO: Copied from BaseRepository and added the cloned model to write back the
     * item_number correctly. This must be reversed with #4738 (indroduced with #4639)
     *
     * Saves the (full) update to an existing model. So called "update"-function
     * Provides a default procedure, but can be overwritten if required
     *
     * @param update the update that should be created
     * @param viewModel the view model that the update is based on
     */
    public async update(update: Partial<Item>, viewModel: ViewItem): Promise<void> {
        const sendUpdate = new this.baseModelCtor();
        sendUpdate.patchValues(viewModel.getModel());
        sendUpdate.patchValues(update);

        const clone = JSON.parse(JSON.stringify(sendUpdate));
        clone.item_number = clone._itemNumber;
        const restPath = `/rest/${sendUpdate.collectionString}/${sendUpdate.id}/`;
        return await this.httpService.put(restPath, clone);
    }

    /**
     * Get agenda visibility from the config
     *
     * @return An observable to the default agenda visibility
     */
    public getDefaultAgendaVisibility(): Observable<number> {
        return this.config.get('agenda_new_items_default_visibility').pipe(map(key => +key));
    }

    /**
     * Sends the changed nodes to the server.
     *
     * @param data The reordered data from the sorting
     */
    public async sortItems(data: TreeIdNode[]): Promise<void> {
        await this.httpService.post('/rest/agenda/item/sort/', data);
    }

    /**
     * Calculates the estimated end time based on the configured start and the
     * sum of durations of all agenda items
     *
     * @returns a Date object or null
     */
    public calculateEndTime(): Date {
        const startTime = this.config.instant<number>('agenda_start_event_date_time'); // a timestamp
        const duration = this.calculateDuration();
        if (!startTime || !duration) {
            return null;
        }
        const durationTime = duration * 60 * 1000; // minutes to miliseconds
        return new Date(startTime + durationTime);
    }

    /**
     * get the sum of durations of all agenda items
     *
     * @returns a numerical value representing item durations (currently minutes)
     */
    public calculateDuration(): number {
        let duration = 0;
        this.getViewModelList().forEach(item => {
            if (item.duration) {
                duration += item.duration;
            }
        });
        return duration;
    }
}
