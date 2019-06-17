import { Topic } from 'app/shared/models/topics/topic';
import { SearchRepresentation } from 'app/core/ui-services/search.service';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { ViewMediafile } from 'app/site/mediafiles/models/view-mediafile';
import { ViewItem } from '../../agenda/models/view-item';
import { BaseViewModel } from 'app/site/base/base-view-model';
import { ViewListOfSpeakers } from '../../agenda/models/view-list-of-speakers';
import { BaseViewModelWithAgendaItemAndListOfSpeakers } from 'app/site/base/base-view-model-with-agenda-item-and-list-of-speakers';
import { TitleInformationWithAgendaItem } from 'app/site/base/base-view-model-with-agenda-item';

export interface TopicTitleInformation extends TitleInformationWithAgendaItem {
    title: string;
    agenda_item_number?: string;
}

/**
 * Provides "safe" access to topic with all it's components
 * @ignore
 */
export class ViewTopic extends BaseViewModelWithAgendaItemAndListOfSpeakers implements TopicTitleInformation {
    public static COLLECTIONSTRING = Topic.COLLECTIONSTRING;

    private _attachments?: ViewMediafile[];

    public get topic(): Topic {
        return this._model;
    }

    public get attachments(): ViewMediafile[] {
        return this._attachments || [];
    }

    public get attachments_id(): number[] {
        return this.topic.attachments_id;
    }

    public get title(): string {
        return this.topic.title;
    }

    public get text(): string {
        return this.topic.text;
    }

    public constructor(
        topic: Topic,
        attachments?: ViewMediafile[],
        item?: ViewItem,
        listOfSpeakers?: ViewListOfSpeakers
    ) {
        super(Topic.COLLECTIONSTRING, topic, item, listOfSpeakers);
        this._attachments = attachments;
    }

    /**
     * Formats the category for search
     *
     * @override
     */
    public formatForSearch(): SearchRepresentation {
        return [this.title, this.text];
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

    public updateDependencies(update: BaseViewModel): void {
        super.updateDependencies(update);
        if (update instanceof ViewMediafile && this.attachments_id.includes(update.id)) {
            const attachmentIndex = this.attachments.findIndex(mediafile => mediafile.id === update.id);
            if (attachmentIndex < 0) {
                this.attachments.push(update);
            } else {
                this.attachments[attachmentIndex] = update;
            }
        }
    }
}
