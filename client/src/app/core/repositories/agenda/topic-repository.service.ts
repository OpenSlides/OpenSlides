import { Injectable } from '@angular/core';

import { Topic } from 'app/shared/models/topics/topic';
import { BaseRepository } from 'app/core/repositories/base-repository';
import { Mediafile } from 'app/shared/models/mediafiles/mediafile';
import { Item } from 'app/shared/models/agenda/item';
import { DataStoreService } from 'app/core/core-services/data-store.service';
import { DataSendService } from 'app/core/core-services/data-send.service';
import { ViewTopic } from 'app/site/agenda/models/view-topic';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { CollectionStringMapperService } from 'app/core/core-services/collectionStringMapper.service';
import { CreateTopic } from 'app/site/agenda/models/create-topic';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { ViewMediafile } from 'app/site/mediafiles/models/view-mediafile';
import { ViewItem } from 'app/site/agenda/models/view-item';
import { TranslateService } from '@ngx-translate/core';

/**
 * Repository for topics
 */
@Injectable({
    providedIn: 'root'
})
export class TopicRepositoryService extends BaseRepository<ViewTopic, Topic> {
    /**
     * Constructor calls the parent constructor
     *
     * @param DS Access the DataStore
     * @param mapperService OpenSlides mapping service for collections
     * @param dataSend Access the DataSendService
     */
    public constructor(
        DS: DataStoreService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        private dataSend: DataSendService,
        private translate: TranslateService
    ) {
        super(DS, mapperService, viewModelStoreService, Topic, [Mediafile, Item]);
    }

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
        viewTopic.getVerboseName = (plural: boolean = false) => {
            return this.translate.instant(plural ? 'Topics' : 'Topic');
        };
        return viewTopic;
    }

    /**
     * Save a new topic
     *
     * @param topicData Partial topic data to be created
     * @returns an Identifiable (usually id) as promise
     */
    public async create(topic: CreateTopic): Promise<Identifiable> {
        return await this.dataSend.createModel(topic);
    }

    /**
     * Change an existing topic
     *
     * @param updateData form value containing the data meant to update the topic
     * @param viewTopic the topic that should receive the update
     */
    public async update(updateData: Partial<Topic>, viewTopic: ViewTopic): Promise<void> {
        const updateTopic = new Topic();
        updateTopic.patchValues(viewTopic.topic);
        updateTopic.patchValues(updateData);

        return await this.dataSend.updateModel(updateTopic);
    }

    /**
     * Delete a topic
     *
     * @param viewTopic the topic that should be removed
     */
    public async delete(viewTopic: ViewTopic): Promise<void> {
        return await this.dataSend.deleteModel(viewTopic.topic);
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
