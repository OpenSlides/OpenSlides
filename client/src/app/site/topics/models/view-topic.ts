import { SearchRepresentation } from 'app/core/ui-services/search.service';
import { Topic } from 'app/shared/models/topics/topic';
import { TitleInformationWithAgendaItem } from 'app/site/base/base-view-model-with-agenda-item';
import { BaseViewModelWithAgendaItemAndListOfSpeakers } from 'app/site/base/base-view-model-with-agenda-item-and-list-of-speakers';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { ViewMediafile } from 'app/site/mediafiles/models/view-mediafile';

export interface TopicTitleInformation extends TitleInformationWithAgendaItem {
    title: string;
    agenda_item_number?: () => string;
}

/**
 * Provides "safe" access to topic with all it's components
 * @ignore
 */
export class ViewTopic extends BaseViewModelWithAgendaItemAndListOfSpeakers<Topic> implements TopicTitleInformation {
    public static COLLECTIONSTRING = Topic.COLLECTIONSTRING;

    public get topic(): Topic {
        return this._model;
    }

    /**
     * Formats the category for search
     *
     * @override
     */
    public formatForSearch(): SearchRepresentation {
        return {
            properties: [
                { key: 'Title', value: this.getTitle() },
                { key: 'Text', value: this.text, trusted: true }
            ],
            searchValue: [this.getTitle(), this.text]
        };
    }

    public getDetailStateURL(): string {
        return `/topics/${this.id}`;
    }

    /**
     * Returns the text to be inserted in csv exports
     * @override
     */
    public getCSVExportText(): string {
        return this.text;
    }

    public getSlide(): ProjectorElementBuildDeskriptor {
        return {
            getBasicProjectorElement: options => ({
                name: Topic.COLLECTIONSTRING,
                id: this.id,
                getIdentifiers: () => ['name', 'id']
            }),
            slideOptions: [],
            projectionDefaultName: 'topics',
            getDialogTitle: () => this.getTitle()
        };
    }

    public hasAttachments(): boolean {
        return this.attachments && this.attachments.length > 0;
    }
}
interface ITopicRelations {
    attachments: ViewMediafile[];
}

export interface ViewTopic extends Topic, ITopicRelations {}
