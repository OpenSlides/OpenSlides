import { Injectable } from '@angular/core';

import { CollectionStringMapperService } from 'app/core/core-services/collection-string-mapper.service';
import { DataStoreService } from 'app/core/core-services/data-store.service';
import { BaseRepository } from 'app/core/repositories/base-repository';
import { History } from 'app/shared/models/core/history';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { HttpService } from 'app/core/core-services/http.service';
import { ViewHistory, ProxyHistory } from 'app/site/history/models/view-history';
import { TimeTravelService } from 'app/core/core-services/time-travel.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { ViewUser } from 'app/site/users/models/view-user';
import { TranslateService } from '@ngx-translate/core';
import { DataSendService } from 'app/core/core-services/data-send.service';

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
        dataSend: DataSendService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        translate: TranslateService,
        private httpService: HttpService,
        private timeTravel: TimeTravelService
    ) {
        super(DS, dataSend, mapperService, viewModelStoreService, translate, History);
    }

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Histories' : 'History');
    };

    /**
     * Creates a new ViewHistory objects out of a historyObject
     *
     * @param history the source history object
     * @return a new ViewHistory object
     */
    public createViewModel(history: History): ViewHistory {
        const viewHistory = new ViewHistory(this.createProxyHistory(history));
        viewHistory.getVerboseName = this.getVerboseName;
        return viewHistory;
    }

    /**
     * Creates a ProxyHistory from a History by wrapping it and give access to the user.
     *
     * @param history The History object
     * @returns the ProxyHistory
     */
    private createProxyHistory(history: History): ProxyHistory {
        return new Proxy(history, {
            get: (instance, property) => {
                if (property === 'user') {
                    return this.viewModelStoreService.get(ViewUser, instance.user_id);
                } else {
                    return instance[property];
                }
            }
        });
    }

    /**
     * Overwrites the default procedure
     *
     * @ignore
     */
    public async create(): Promise<Identifiable> {
        throw new Error('You cannot create a history object');
    }

    /**
     * Overwrites the default procedure
     *
     * @ignore
     */
    public async update(): Promise<void> {
        throw new Error('You cannot update a history object');
    }

    /**
     * Overwrites the default procedure
     *
     * @ignore
     */
    public async patch(): Promise<void> {
        throw new Error('You cannot patch a history object');
    }

    /**
     * Overwrites the default procedure
     *
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
        const model = this.viewModelStoreService.get(collectionString, id);
        if (model) {
            return model.getListTitle();
        }
        return null;
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
