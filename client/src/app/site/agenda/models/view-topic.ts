import { Topic } from 'app/shared/models/topics/topic';
import { BaseAgendaViewModel } from 'app/site/base/base-agenda-view-model';
import { SearchRepresentation } from 'app/core/ui-services/search.service';
import { ProjectorElementBuildDeskriptor } from 'app/site/base/projectable';
import { ViewMediafile } from 'app/site/mediafiles/models/view-mediafile';
import { ViewItem } from './view-item';
import { BaseViewModel } from 'app/site/base/base-view-model';

/**
 * Provides "safe" access to topic with all it's components
 * @ignore
 */
export class ViewTopic extends BaseAgendaViewModel {
    public static COLLECTIONSTRING = Topic.COLLECTIONSTRING;

    protected _topic: Topic;
    private _attachments: ViewMediafile[];
    private _agendaItem: ViewItem;

    public get topic(): Topic {
        return this._topic;
    }

    public get attachments(): ViewMediafile[] {
        return this._attachments;
    }

    public get agendaItem(): ViewItem {
        return this._agendaItem;
    }

    public get id(): number {
        return this.topic.id;
    }

    public get agenda_item_id(): number {
        return this.topic.agenda_item_id;
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

    /**
     * This is set by the repository
     */
    public getVerboseName;

    public constructor(topic: Topic, attachments?: ViewMediafile[], item?: ViewItem) {
        super(Topic.COLLECTIONSTRING);
        this._topic = topic;
        this._attachments = attachments;
        this._agendaItem = item;
    }

    public getTitle = () => {
        return this.title;
    };

    public getAgendaItem(): ViewItem {
        return this.agendaItem;
    }

    public getAgendaTitleWithType = () => {
        // Do not append ' (Topic)' to the title.
        return this.getAgendaTitle();
    };

    /**
     * Formats the category for search
     *
     * @override
     */
    public formatForSearch(): SearchRepresentation {
        return [this.title, this.text];
    }

    public getDetailStateURL(): string {
        return `/agenda/topics/${this.id}`;
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
            getBasicProjectorElement: () => ({
                name: Topic.COLLECTIONSTRING,
                id: this.id,
                getIdentifiers: () => ['name', 'id']
            }),
            slideOptions: [],
            projectionDefaultName: 'topics',
            getTitle: () => this.getTitle()
        };
    }

    public hasAttachments(): boolean {
        return this.attachments && this.attachments.length > 0;
    }

    public updateDependencies(update: BaseViewModel): void {
        if (update instanceof ViewMediafile && this.attachments_id.includes(update.id)) {
            const attachmentIndex = this.attachments.findIndex(mediafile => mediafile.id === update.id);
            if (attachmentIndex < 0) {
                this.attachments.push(update);
            } else {
                this.attachments[attachmentIndex] = update;
            }
        }
        if (update instanceof ViewItem && this.agenda_item_id === update.id) {
            this._agendaItem = update;
        }
    }
}
