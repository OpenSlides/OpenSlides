import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { CollectionStringMapperService } from '../../core-services/collection-string-mapper.service';
import { DataSendService } from 'app/core/core-services/data-send.service';
import { DataStoreService } from '../../core-services/data-store.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { ViewListOfSpeakers, ListOfSpeakersTitleInformation } from 'app/site/agenda/models/view-list-of-speakers';
import { ListOfSpeakers } from 'app/shared/models/agenda/list-of-speakers';
import {
    BaseViewModelWithListOfSpeakers,
    isBaseViewModelWithListOfSpeakers
} from 'app/site/base/base-view-model-with-list-of-speakers';
import { BaseViewModel } from 'app/site/base/base-view-model';
import { ViewSpeaker } from 'app/site/agenda/models/view-speaker';
import { ViewUser } from 'app/site/users/models/view-user';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { HttpService } from 'app/core/core-services/http.service';
import { BaseIsListOfSpeakersContentObjectRepository } from '../base-is-list-of-speakers-content-object-repository';
import { BaseHasContentObjectRepository } from '../base-has-content-object-repository';
import { Topic } from 'app/shared/models/topics/topic';
import { Assignment } from 'app/shared/models/assignments/assignment';
import { Motion } from 'app/shared/models/motions/motion';
import { MotionBlock } from 'app/shared/models/motions/motion-block';
import { Mediafile } from 'app/shared/models/mediafiles/mediafile';
import { ItemRepositoryService } from './item-repository.service';
import { User } from 'app/shared/models/users/user';

/**
 * Repository service for lists of speakers
 *
 * Documentation partially provided in {@link BaseRepository}
 */
@Injectable({
    providedIn: 'root'
})
export class ListOfSpeakersRepositoryService extends BaseHasContentObjectRepository<
    ViewListOfSpeakers,
    ListOfSpeakers,
    BaseViewModelWithListOfSpeakers,
    ListOfSpeakersTitleInformation
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
        private itemRepo: ItemRepositoryService
    ) {
        super(DS, dataSend, mapperService, viewModelStoreService, translate, ListOfSpeakers, [
            Topic,
            Assignment,
            Motion,
            MotionBlock,
            Mediafile,
            User
        ]);
    }

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Lists of speakers' : 'List of speakers');
    };

    public getTitle = (titleInformation: ListOfSpeakersTitleInformation) => {
        if (titleInformation.contentObject) {
            return titleInformation.contentObject.getListOfSpeakersTitle();
        } else {
            const repo = this.collectionStringMapperService.getRepository(
                titleInformation.contentObjectData.collection
            ) as BaseIsListOfSpeakersContentObjectRepository<any, any, any>;

            // Try to get the agenda item for this to get the item number
            // TODO: This can be resolved with #4738
            const item = this.itemRepo.findByContentObject(titleInformation.contentObjectData);
            if (item) {
                (<any>titleInformation.title_information).agenda_item_number = item.itemNumber;
            }

            return repo.getListOfSpeakersTitle(titleInformation.title_information);
        }
    };

    /**
     * Creates the viewListOfSpeakers out of a given list of speakers
     *
     * @param listOfSpeakers the list fo speakers that should be converted to view item
     * @returns a new view list fo speakers
     */
    public createViewModel(listOfSpeakers: ListOfSpeakers): ViewListOfSpeakers {
        const contentObject = this.getContentObject(listOfSpeakers);
        const speakers = this.getSpeakers(listOfSpeakers);
        return new ViewListOfSpeakers(listOfSpeakers, speakers, contentObject);
    }

    private getSpeakers(listOfSpeakers: ListOfSpeakers): ViewSpeaker[] {
        return listOfSpeakers.speakers.map(speaker => {
            const user = this.viewModelStoreService.get(ViewUser, speaker.user_id);
            return new ViewSpeaker(speaker, user);
        });
    }

    /**
     * Returns the corresponding content object to a given {@link ListOfSpeakers} as an {@link BaseListOfSpeakersViewModel}
     *
     * @param listOfSpeakers the target list fo speakers
     * @returns the content object of the given list of sepakers. Might be null if it was not found.
     */
    public getContentObject(listOfSpeakers: ListOfSpeakers): BaseViewModelWithListOfSpeakers {
        const contentObject = this.viewModelStoreService.get<BaseViewModel>(
            listOfSpeakers.content_object.collection,
            listOfSpeakers.content_object.id
        );
        if (!contentObject) {
            return null;
        }
        if (isBaseViewModelWithListOfSpeakers(contentObject)) {
            return contentObject;
        } else {
            throw new Error(
                `The content object (${listOfSpeakers.content_object.collection}, ${listOfSpeakers.content_object.id}) of list of speakers ${listOfSpeakers.id} is not a BaseListOfSpeakersViewModel.`
            );
        }
    }

    /**
     * Add a new speaker to a list of speakers.
     * Sends the users id to the server
     *
     * @param userId {@link User} id of the new speaker
     * @param listOfSpeakers the target agenda item
     */
    public async createSpeaker(listOfSpeakers: ViewListOfSpeakers, userId: number): Promise<Identifiable> {
        const restUrl = this.getRestUrl(listOfSpeakers.id, 'manage_speaker');
        return await this.httpService.post<Identifiable>(restUrl, { user: userId });
    }

    /**
     * Removes the given speaker for the list of speakers
     *
     * @param listOfSpeakers the target list of speakers
     * @param speakerId (otional) the speakers id. If no id is given, the speaker with the
     * current operator is removed.
     */
    public async delete(listOfSpeakers: ViewListOfSpeakers, speakerId?: number): Promise<void> {
        const restUrl = this.getRestUrl(listOfSpeakers.id, 'manage_speaker');
        await this.httpService.delete(restUrl, speakerId ? { speaker: speakerId } : null);
    }

    /**
     * Deletes all speakers of the given list of speakers.
     *
     * @param listOfSpeakers the target list of speakers
     */
    public async deleteAllSpeakers(listOfSpeakers: ViewListOfSpeakers): Promise<void> {
        const restUrl = this.getRestUrl(listOfSpeakers.id, 'manage_speaker');
        await this.httpService.delete(restUrl, { speaker: listOfSpeakers.speakers.map(speaker => speaker.id) });
    }

    /**
     * Posts an (manually) sorted speaker list to the server
     *
     * @param speakerIds array of speaker id numbers
     * @param Item the target agenda item
     */
    public async sortSpeakers(listOfSpeakers: ViewListOfSpeakers, speakerIds: number[]): Promise<void> {
        const restUrl = this.getRestUrl(listOfSpeakers.id, 'sort_speakers');
        await this.httpService.post(restUrl, { speakers: speakerIds });
    }

    /**
     * Marks all speakers for a given user
     *
     * @param userId {@link User} id of the user
     * @param marked determine if the user should be marked or not
     * @param listOfSpeakers the target list of speakers
     */
    public async markSpeaker(listOfSpeakers: ViewListOfSpeakers, speaker: ViewSpeaker, marked: boolean): Promise<void> {
        const restUrl = this.getRestUrl(listOfSpeakers.id, 'manage_speaker');
        await this.httpService.patch(restUrl, { user: speaker.user.id, marked: marked });
    }

    /**
     * Stops the current speaker
     *
     * @param listOfSpeakers the target list of speakers
     */
    public async stopCurrentSpeaker(listOfSpeakers: ViewListOfSpeakers): Promise<void> {
        const restUrl = this.getRestUrl(listOfSpeakers.id, 'speak');
        await this.httpService.delete(restUrl);
    }

    /**
     * Sets the given speaker id to speak
     *
     * @param speakerId the speakers id
     * @param listOfSpeakers the target list of speakers
     */
    public async startSpeaker(listOfSpeakers: ViewListOfSpeakers, speaker: ViewSpeaker): Promise<void> {
        const restUrl = this.getRestUrl(listOfSpeakers.id, 'speak');
        await this.httpService.put(restUrl, { speaker: speaker.id });
    }

    /**
     * Helper function get the url to the speaker rest address
     *
     * @param listOfSpeakersId id of the list of speakers
     * @param method the desired speaker action
     */
    private getRestUrl(listOfSpeakersId: number, method: 'manage_speaker' | 'sort_speakers' | 'speak'): string {
        return `/rest/agenda/list-of-speakers/${listOfSpeakersId}/${method}/`;
    }
}
