import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { BaseAgendaContentObjectRepository } from '../base-agenda-content-object-repository';
import { CollectionStringMapperService } from 'app/core/core-services/collection-string-mapper.service';
import { DataStoreService } from 'app/core/core-services/data-store.service';
import { DataSendService } from 'app/core/core-services/data-send.service';
import { Item } from 'app/shared/models/agenda/item';
import { Mediafile } from 'app/shared/models/mediafiles/mediafile';
import { Topic } from 'app/shared/models/topics/topic';
import { ViewTopic } from 'app/site/agenda/models/view-topic';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { ViewMediafile } from 'app/site/mediafiles/models/view-mediafile';
import { ViewItem } from 'app/site/agenda/models/view-item';

/**
 * Repository for topics
 */
@Injectable({
    providedIn: 'root'
})
export class TopicRepositoryService extends BaseAgendaContentObjectRepository<ViewTopic, Topic> {
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
        translate: TranslateService
    ) {
        super(DS, dataSend, mapperService, viewModelStoreService, translate, Topic, [Mediafile, Item]);
    }

    public getAgendaTitle = (topic: Partial<Topic> | Partial<ViewTopic>) => {
        return topic.title;
    };

    public getAgendaTitleWithType = (topic: Partial<Topic> | Partial<ViewTopic>) => {
        // Do not append ' (Topic)' to the title.
        return topic.title;
    };

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Topics' : 'Topic');
    };

    /**
     * Creates a new viewModel out of the given model
     *
     * @param topic The topic that shall be converted into a view topic
     * @returns a new view topic
     */
    public createViewModel(topic: Topic): ViewTopic {
        const attachments = this.viewModelStoreService.getMany(ViewMediafile, topic.attachments_id);
        const item = this.viewModelStoreService.get(ViewItem, topic.agenda_item_id);
        const viewTopic = new ViewTopic(topic, attachments, item);
        viewTopic.getVerboseName = this.getVerboseName;
        viewTopic.getAgendaTitle = () => this.getAgendaTitle(viewTopic);
        viewTopic.getAgendaTitleWithType = () => this.getAgendaTitle(viewTopic);
        return viewTopic;
    }

    /**
     * Returns an array of all duplicates for a topic
     *
     * @param topic
     */
    public getTopicDuplicates(topic: ViewTopic): ViewTopic[] {
        const duplicates = this.DS.filter(Topic, item => topic.title === item.title);
        const viewTopics: ViewTopic[] = [];
        duplicates.forEach(item => viewTopics.push(this.createViewModel(item)));
        return viewTopics;
    }
}
