import { Injectable } from '@angular/core';
import { tap, map } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { BaseAgendaContentObjectRepository } from '../base-agenda-content-object-repository';
import { BaseRepository } from '../base-repository';
import { BaseAgendaViewModel } from 'app/site/base/base-agenda-view-model';
import { BaseViewModel } from 'app/site/base/base-view-model';
import { CollectionStringMapperService } from '../../core-services/collectionStringMapper.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { DataSendService } from 'app/core/core-services/data-send.service';
import { DataStoreService } from '../../core-services/data-store.service';
import { HttpService } from 'app/core/core-services/http.service';
import { Item } from 'app/shared/models/agenda/item';
import { OSTreeSortEvent } from 'app/shared/components/sorting-tree/sorting-tree.component';
import { TranslateService } from '@ngx-translate/core';
import { TreeService } from 'app/core/ui-services/tree.service';
import { ViewItem } from 'app/site/agenda/models/view-item';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';

/**
 * Repository service for users
 *
 * Documentation partially provided in {@link BaseRepository}
 */
@Injectable({
    providedIn: 'root'
})
export class ItemRepositoryService extends BaseRepository<ViewItem, Item> {
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
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        protected dataSend: DataSendService,
        private httpService: HttpService,
        private config: ConfigService,
        private treeService: TreeService,
        private translate: TranslateService
    ) {
        super(DS, dataSend, mapperService, viewModelStoreService, Item);
    }

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Items' : 'Item');
    };

    protected setupDependencyObservation(): void {
        this.DS.secondaryModelChangeSubject.subscribe(model => {
            const viewModel = this.viewModelStoreService.get(model.collectionString, model.id);
            const somethingChanged = this.getViewModelList().some(ownViewModel => {
                return ownViewModel.updateDependencies(viewModel);
            });
            if (somethingChanged) {
                this.updateAllObservables(model.id);
            }
        });
    }

    /**
     * Creates the viewItem out of a given item
     *
     * @param item the item that should be converted to view item
     * @returns a new view item
     */
    public createViewModel(item: Item): ViewItem {
        const contentObject = this.getContentObject(item);
        const viewItem = new ViewItem(item, contentObject);
        viewItem.getVerboseName = this.getVerboseName;
        viewItem.getTitle = () => {
            const numberPrefix = viewItem.itemNumber ? `${viewItem.itemNumber} · ` : '';

            if (viewItem.contentObject) {
                return numberPrefix + viewItem.contentObject.getAgendaTitleWithType();
            } else {
                const repo = this.collectionStringMapperService.getRepository(
                    viewItem.item.content_object.collection
                ) as BaseAgendaContentObjectRepository<any, any>;
                return numberPrefix + repo.getAgendaTitleWithType(viewItem);
            }
        };
        viewItem.getListTitle = viewItem.getTitle;
        return viewItem;
    }

    /**
     * Returns the corresponding content object to a given {@link Item} as an {@link AgendaBaseViewModel}
     *
     * @param agendaItem the target agenda Item
     * @returns the content object of the given item. Might be null if it was not found.
     */
    public getContentObject(agendaItem: Item): BaseAgendaViewModel {
        const contentObject = this.viewModelStoreService.get<BaseViewModel>(
            agendaItem.content_object.collection,
            agendaItem.content_object.id
        );
        if (!contentObject) {
            return null;
        }
        if (contentObject instanceof BaseAgendaViewModel) {
            return contentObject as BaseAgendaViewModel;
        } else {
            throw new Error(
                `The content object (${agendaItem.content_object.collection}, ${
                    agendaItem.content_object.id
                }) of item ${agendaItem.id} is not a AgendaBaseViewModel.`
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
    public async sortItems(data: OSTreeSortEvent): Promise<void> {
        const url = '/rest/agenda/item/sort/';
        await this.httpService.post(url, data);
    }

    /**
     * Add custom hook into the observables. The ViewItems get a virtual agendaListWeight (a sequential number)
     * for the agenda topic order, and a virtual level for the hierarchy in the agenda list tree. Both values can be used
     * for sorting and ordering instead of dealing with the sort parent id and weight.
     *
     * @override
     */
    public getViewModelListObservable(): Observable<ViewItem[]> {
        return super.getViewModelListObservable().pipe(
            tap(items => {
                const iterator = this.treeService.traverseItems(items, 'weight', 'parent_id');
                let m: IteratorResult<ViewItem>;
                let virtualWeightCounter = 0;
                while (!(m = iterator.next()).done) {
                    m.value.agendaListWeight = virtualWeightCounter++;
                    m.value.agendaListLevel = m.value.parent_id
                        ? this.getViewModel(m.value.parent_id).agendaListLevel + 1
                        : 0;
                }
            })
        );
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
