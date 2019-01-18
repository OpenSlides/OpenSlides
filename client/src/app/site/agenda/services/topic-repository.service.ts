import { Injectable } from '@angular/core';

import { Topic } from 'app/shared/models/topics/topic';
import { BaseRepository } from 'app/site/base/base-repository';
import { Mediafile } from 'app/shared/models/mediafiles/mediafile';
import { Item } from 'app/shared/models/agenda/item';
import { DataStoreService } from 'app/core/services/data-store.service';
import { DataSendService } from 'app/core/services/data-send.service';
import { ViewTopic } from '../models/view-topic';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { CollectionStringModelMapperService } from 'app/core/services/collectionStringModelMapper.service';
import { CreateTopic } from '../models/create-topic';

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
        mapperService: CollectionStringModelMapperService,
        private dataSend: DataSendService
    ) {
        super(DS, mapperService, Topic, [Mediafile, Item]);
    }

    /**
     * Creates a new viewModel out of the given model
     *
     * @param topic The topic that shall be converted into a view topic
     * @returns a new view topic
     */
    public createViewModel(topic: Topic): ViewTopic {
        const attachments = this.DS.getMany(Mediafile, topic.attachments_id);
        const item = this.getAgendaItem(topic);
        return new ViewTopic(topic, attachments, item);
    }

    /**
     * Gets the corresponding agendaItem to the topic.
     * Used to deal with race conditions
     *
     * @param topic the topic for the agenda item
     * @returns an agenda item that fits for the topic
     */
    public getAgendaItem(topic: Topic): Item {
        return this.DS.get(Item, topic.agenda_item_id);
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
