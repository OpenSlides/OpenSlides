import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { DataSendService } from 'app/core/core-services/data-send.service';
import { HttpService } from 'app/core/core-services/http.service';
import { RelationManagerService } from 'app/core/core-services/relation-manager.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { RelationDefinition } from 'app/core/definitions/relations';
import { ListOfSpeakers } from 'app/shared/models/agenda/list-of-speakers';
import { Speaker } from 'app/shared/models/agenda/speaker';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { ListOfSpeakersTitleInformation, ViewListOfSpeakers } from 'app/site/agenda/models/view-list-of-speakers';
import { ViewSpeaker } from 'app/site/agenda/models/view-speaker';
import { ViewAssignment } from 'app/site/assignments/models/view-assignment';
import {
    BaseViewModelWithListOfSpeakers,
    isBaseViewModelWithListOfSpeakers
} from 'app/site/base/base-view-model-with-list-of-speakers';
import { ViewMediafile } from 'app/site/mediafiles/models/view-mediafile';
import { ViewMotion } from 'app/site/motions/models/view-motion';
import { ViewMotionBlock } from 'app/site/motions/models/view-motion-block';
import { ViewTopic } from 'app/site/topics/models/view-topic';
import { ViewUser } from 'app/site/users/models/view-user';
import { BaseHasContentObjectRepository } from '../base-has-content-object-repository';
import { BaseIsListOfSpeakersContentObjectRepository } from '../base-is-list-of-speakers-content-object-repository';
import { NestedModelDescriptors } from '../base-repository';
import { CollectionStringMapperService } from '../../core-services/collection-string-mapper.service';
import { DataStoreService } from '../../core-services/data-store.service';
import { ItemRepositoryService } from './item-repository.service';

const ListOfSpeakersRelations: RelationDefinition[] = [
    {
        type: 'generic',
        possibleModels: [ViewMotion, ViewMotionBlock, ViewTopic, ViewAssignment, ViewMediafile],
        isVForeign: isBaseViewModelWithListOfSpeakers,
        VForeignVerbose: 'BaseViewModelWithListOfSpeakers',
        ownContentObjectDataKey: 'contentObjectData',
        ownKey: 'contentObject'
    }
];

const ListOfSpeakersNestedModelDescriptors: NestedModelDescriptors = {
    'agenda/list-of-speakers': [
        {
            ownKey: 'speakers',
            foreignViewModel: ViewSpeaker,
            foreignModel: Speaker,
            order: 'weight',
            relationDefinitionsByKey: {
                user: {
                    type: 'M2O',
                    ownIdKey: 'user_id',
                    ownKey: 'user',
                    foreignViewModel: ViewUser
                }
            },
            titles: {
                getTitle: (viewSpeaker: ViewSpeaker) => viewSpeaker.name
            }
        }
    ]
};

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
        relationManager: RelationManagerService,
        private httpService: HttpService,
        private itemRepo: ItemRepositoryService
    ) {
        super(
            DS,
            dataSend,
            mapperService,
            viewModelStoreService,
            translate,
            relationManager,
            ListOfSpeakers,
            ListOfSpeakersRelations,
            ListOfSpeakersNestedModelDescriptors
        );
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
                (<any>titleInformation.title_information).agenda_item_number = () => item.item_number;
            }

            return repo.getListOfSpeakersTitle(titleInformation.title_information);
        }
    };

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
     * Readds the last speaker to the list of speakers
     *
     * @param listOfSpeakers the list of speakers to modify
     */
    public async readdLastSpeaker(listOfSpeakers: ViewListOfSpeakers): Promise<void> {
        const restUrl = this.getRestUrl(listOfSpeakers.id, 'readd_last_speaker');
        await this.httpService.post(restUrl);
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
    private getRestUrl(
        listOfSpeakersId: number,
        method: 'manage_speaker' | 'sort_speakers' | 'speak' | 'readd_last_speaker'
    ): string {
        return `/rest/agenda/list-of-speakers/${listOfSpeakersId}/${method}/`;
    }
}
