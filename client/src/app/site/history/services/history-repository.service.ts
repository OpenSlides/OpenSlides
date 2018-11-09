import { Injectable } from '@angular/core';

import { CollectionStringModelMapperService } from 'app/core/services/collectionStringModelMapper.service';
import { DataStoreService } from 'app/core/services/data-store.service';
import { BaseRepository } from 'app/site/base/base-repository';
import { History } from 'app/shared/models/core/history';
import { User } from 'app/shared/models/users/user';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { HttpService } from 'app/core/services/http.service';
import { ViewHistory } from '../models/view-history';
import { TimeTravelService } from 'app/core/services/time-travel.service';
import { BaseModel } from 'app/shared/models/base/base-model';

/**
 * Repository for the history.
 *
 * Gets new history objects/entries and provides them for the view.
 */
@Injectable({
    providedIn: 'root'
})
export class HistoryRepositoryService extends BaseRepository<ViewHistory, History> {
    /**
     * Constructs the history repository
     *
     * @param DS The DataStore
     * @param mapperService mapps the models to the collection string
     * @param httpService OpenSlides own HTTP service
     * @param timeTravel To change the time
     */
    public constructor(
        DS: DataStoreService,
        mapperService: CollectionStringModelMapperService,
        private httpService: HttpService,
        private timeTravel: TimeTravelService
    ) {
        super(DS, mapperService, History, [User]);
    }

    /**
     * Clients usually do not need to create a history object themselves
     * @ignore
     */
    public async create(): Promise<Identifiable> {
        throw new Error('You cannot create a history object');
    }

    /**
     * Clients usually do not need to modify existing history objects
     * @ignore
     */
    public async update(): Promise<void> {
        throw new Error('You cannot update a history object');
    }

    /**
     * Sends a post-request to delete history objects
     */
    public async delete(): Promise<void> {
        const restPath = 'rest/core/history/clear_history/';
        await this.httpService.post(restPath);
    }

    /**
     * Get the ListTitle of a history Element from the dataStore
     * using the collection string and the ID.
     *
     * @param collectionString the models collection string
     * @param id the models id
     * @returns the ListTitle or null if the model was deleted already
     */
    public getOldModelInfo(collectionString: string, id: number): string {
        const oldModel: BaseModel = this.DS.get(collectionString, id);
        if (oldModel) {
            return oldModel.getListTitle();
        } else {
            return null;
        }
    }

    /**
     * Creates a new ViewHistory objects out of a historyObject
     *
     * @param history the source history object
     * @return a new ViewHistory object
     */
    public createViewModel(history: History): ViewHistory {
        const user = this.DS.get(User, history.user_id);
        return new ViewHistory(history, user);
    }

    /**
     * Get the full data on the given date and use the
     * TimeTravelService to browse the history on the
     * given date
     *
     * @param viewHistory determines to point to travel back to
     */
    public async browseHistory(viewHistory: ViewHistory): Promise<void> {
        return this.timeTravel.loadHistoryPoint(viewHistory.history);
    }
}
