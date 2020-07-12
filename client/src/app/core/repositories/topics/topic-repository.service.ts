import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { CollectionStringMapperService } from 'app/core/core-services/collection-string-mapper.service';
import { DataSendService } from 'app/core/core-services/data-send.service';
import { DataStoreService } from 'app/core/core-services/data-store.service';
import { RelationManagerService } from 'app/core/core-services/relation-manager.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { RelationDefinition } from 'app/core/definitions/relations';
import { Topic } from 'app/shared/models/topics/topic';
import { ViewMediafile } from 'app/site/mediafiles/models/view-mediafile';
import { CreateTopic } from 'app/site/topics/models/create-topic';
import { TopicTitleInformation, ViewTopic } from 'app/site/topics/models/view-topic';
import { BaseIsAgendaItemAndListOfSpeakersContentObjectRepository } from '../base-is-agenda-item-and-list-of-speakers-content-object-repository';

const TopicRelations: RelationDefinition[] = [
    {
        type: 'M2M',
        ownIdKey: 'attachments_id',
        ownKey: 'attachments',
        foreignViewModel: ViewMediafile
    }
];

/**
 * Repository for topics
 */
@Injectable({
    providedIn: 'root'
})
export class TopicRepositoryService extends BaseIsAgendaItemAndListOfSpeakersContentObjectRepository<
    ViewTopic,
    Topic,
    TopicTitleInformation
> {
    /**
     * Constructor calls the parent constructor
     *
     * @param DS Access the DataStore
     * @param mapperService OpenSlides mapping service for collections
     * @param dataSend Access the DataSendService
     */
    public constructor(
        DS: DataStoreService,
        dataSend: DataSendService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        translate: TranslateService,
        relationManager: RelationManagerService
    ) {
        super(DS, dataSend, mapperService, viewModelStoreService, translate, relationManager, Topic, TopicRelations);
    }

    public getTitle = (titleInformation: TopicTitleInformation) => {
        return titleInformation.title;
    };

    public getListTitle = (titleInformation: TopicTitleInformation) => {
        if (titleInformation.agenda_item_number && titleInformation.agenda_item_number()) {
            return `${titleInformation.agenda_item_number()} · ${titleInformation.title}`;
        } else {
            return this.getTitle(titleInformation);
        }
    };

    public getAgendaListTitle = (titleInformation: TopicTitleInformation) => {
        return { title: this.getListTitle(titleInformation) };
    };

    public getAgendaSlideTitle = (titleInformation: TopicTitleInformation) => {
        return this.getAgendaListTitle(titleInformation).title;
    };

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Topics' : 'Topic');
    };

    public duplicateTopic(topic: ViewTopic): void {
        this.create(
            new CreateTopic({
                ...topic.topic,
                agenda_type: topic.item.type,
                agenda_parent_id: topic.item.parent_id,
                agenda_weight: topic.item.weight
            })
        );
    }
}
