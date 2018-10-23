import { Injectable } from '@angular/core';

import { BaseRepository } from '../../base/base-repository';
import { DataStoreService } from '../../../core/services/data-store.service';
import { Item } from '../../../shared/models/agenda/item';
import { ViewItem } from '../models/view-item';
import { AgendaBaseModel } from '../../../shared/models/base/agenda-base-model';
import { BaseModel } from '../../../shared/models/base/base-model';
import { Identifiable } from '../../../shared/models/base/identifiable';
import { CollectionStringModelMapperService } from '../../../core/services/collectionStringModelMapper.service';
import { ViewSpeaker } from '../models/view-speaker';
import { Speaker } from 'app/shared/models/agenda/speaker';
import { User } from 'app/shared/models/users/user';
import { HttpService } from 'app/core/services/http.service';

/**
 * Repository service for users
 *
 * Documentation partially provided in {@link BaseRepository}
 */
@Injectable({
    providedIn: 'root'
})
export class AgendaRepositoryService extends BaseRepository<ViewItem, Item> {
    /**
     * Contructor for agenda repository.
     * @param DS The DataStore
     * @param httpService OpenSlides own HttpService
     * @param mapperService OpenSlides mapping service for collection strings
     */
    public constructor(
        protected DS: DataStoreService,
        private httpService: HttpService,
        mapperService: CollectionStringModelMapperService
    ) {
        super(DS, mapperService, Item);
    }

    /**
     * Returns the corresponding content object to a given {@link Item} as an {@link AgendaBaseModel}
     * Used dynamically because of heavy race conditions
     * @param agendaItem the target agenda Item
     * @returns the content object of the given item. Might be null if it was not found.
     */
    public getContentObject(agendaItem: Item): AgendaBaseModel {
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
     * Generate viewSpeaker objects from a given agenda Item
     * @param item agenda Item holding speakers
     * @returns the list of view speakers corresponding to the given item
     */
    public createViewSpeakers(item: Item): ViewSpeaker[] {
        let viewSpeakers = [];
        const speakers = item.speakers;
        if (speakers && speakers.length > 0) {
            speakers.forEach((speaker: Speaker) => {
                const user = this.DS.get(User, speaker.user_id);
                viewSpeakers.push(new ViewSpeaker(speaker, user));
            });
        }
        // sort speakers by their weight
        viewSpeakers = viewSpeakers.sort((a, b) => a.weight - b.weight);
        return viewSpeakers;
    }

    /**
     * Add a new speaker to an agenda item.
     * Sends the users ID to the server
     *
     * Might need another repo
     * @param id {@link User} id of the new speaker
     * @param agenda the target agenda item
     */
    public async addSpeaker(id: number, agenda: Item): Promise<void> {
        const restUrl = `rest/agenda/item/${agenda.id}/manage_speaker/`;
        await this.httpService.post<Identifiable>(restUrl, { user: id });
    }

    /**
     * Sets the given speaker ID to Speak
     * @param id the speakers id
     * @param agenda the target agenda item
     */
    public async startSpeaker(id: number, agenda: Item): Promise<void> {
        const restUrl = `rest/agenda/item/${agenda.id}/speak/`;
        await this.httpService.put(restUrl, { speaker: id });
    }

    /**
     * Stops the current speaker
     * @param agenda the target agenda item
     */
    public async stopSpeaker(agenda: Item): Promise<void> {
        const restUrl = `rest/agenda/item/${agenda.id}/speak/`;
        await this.httpService.delete(restUrl);
    }

    /**
     * Marks the current speaker
     * @param id {@link User} id of the new speaker
     * @param mark determine if the user was marked or not
     * @param agenda the target agenda item
     */
    public async markSpeaker(id: number, mark: boolean, agenda: Item): Promise<void> {
        const restUrl = `rest/agenda/item/${agenda.id}/manage_speaker/`;
        await this.httpService.patch(restUrl, { user: id, marked: mark });
    }

    /**
     * Deletes the given speaker for the agenda
     * @param id the speakers id
     * @param agenda the target agenda item
     */
    public async deleteSpeaker(agenda: Item, id?: number): Promise<void> {
        const restUrl = `rest/agenda/item/${agenda.id}/manage_speaker/`;
        await this.httpService.delete(restUrl, { speaker: id });
    }

    /**
     * Posts an (manually) sorted speaker list to the server
     * @param ids array of speaker id numbers
     * @param Item the target agenda item
     */
    public async sortSpeakers(ids: number[], agenda: Item): Promise<void> {
        const restUrl = `rest/agenda/item/${agenda.id}/sort_speakers/`;
        await this.httpService.post(restUrl, { speakers: ids });
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

    /**
     * Creates the viewItem out of a given item
     * @param item the item that should be converted to view item
     * @returns a new view item
     */
    public createViewModel(item: Item): ViewItem {
        const contentObject = this.getContentObject(item);
        return new ViewItem(item, contentObject);
    }
}
