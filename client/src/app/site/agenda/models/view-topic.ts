import { BaseViewModel } from '../../base/base-view-model';
import { Topic } from 'app/shared/models/topics/topic';
import { Mediafile } from 'app/shared/models/mediafiles/mediafile';
import { Item } from 'app/shared/models/agenda/item';

/**
 * Provides "safe" access to topic with all it's components
 */
export class ViewTopic extends BaseViewModel {
    private _topic: Topic;
    private _attachments: Mediafile[];
    private _agenda_item: Item;

    public get topic(): Topic {
        return this._topic;
    }

    public get attachments(): Mediafile[] {
        return this._attachments;
    }

    public get agenda_item(): Item {
        return this._agenda_item;
    }

    public get id(): number {
        return this.topic ? this.topic.id : null;
    }

    public get agenda_item_id(): number {
        return this.topic ? this.topic.agenda_item_id : null;
    }

    public get title(): string {
        return this.topic ? this.topic.title : null;
    }

    public get text(): string {
        return this.topic ? this.topic.text : null;
    }

    public constructor(topic?: Topic, attachments?: Mediafile[], item?: Item) {
        super();
        this._topic = topic;
        this._attachments = attachments;
        this._agenda_item = item;
    }

    public getTitle(): string {
        return this.title;
    }

    public updateValues(update: Topic): void {
        if (this.id === update.id) {
            this._topic = update;
        }
    }
}
