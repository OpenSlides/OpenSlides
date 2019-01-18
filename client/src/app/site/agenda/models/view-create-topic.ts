import { CreateTopic } from './create-topic';
import { ViewTopic } from './view-topic';

/**
 * View model for Topic('Agenda item') creation.
 *
 */
export class ViewCreateTopic extends ViewTopic {
    public get topic(): CreateTopic {
        return this._topic as CreateTopic;
    }

    /**
     * Fetches the field representing the new title
     *
     * @returns title string as set during import (may be different from getTitle)
     */
    public get title(): string {
        return this.topic.title;
    }

    /**
     * Setter for the title. Sets the title of the underlying CreateTopic
     *
     * @param title
     */
    public set title(title: string) {
        this.topic.title = title;
    }

    /**
     * @returns the duration in minutes
     */
    public get duration(): number {
        return this.topic.agenda_duration;
    }

    /**
     * Setter for the duration. Expects values as in {@link DurationService}
     */
    public set duration(duration: number) {
        this.topic.agenda_duration = duration;
    }

    /**
     * @returns the comment string as set during the import
     */
    public get comment(): string {
        return this.topic.agenda_comment;
    }

    /**
     * Sets the comment string of the underlying topic
     * @param comment A string to set as comment
     */
    public set comment(comment: string) {
        this.topic.agenda_comment = comment;
    }

    /**
     * @returns a number representing the item type
     */
    public get type(): number {
        return this.topic.agenda_type;
    }

    /**
     * sets the item type for the topic's agenda entry. No validation is done here.
     *
     * @param A number representing the item's type. See {@link itemVisibilityChoices}
     * for the interpretation of type numbers.
     */
    public set type(type: number) {
        this.topic.agenda_type = type;
    }

    /**
     * Sets the text string of the underlying topic
     *
     * @param text A string.
     */
    public set text(text: string) {
        this.topic.text = text;
    }

    /**
     * @returns the comment string of the underlying topic
     */
    public get text(): string {
        return this.topic.text;
    }

    /**
     * Checks if the CreateTopic is valid. Currently only requires an existing title
     *
     * @returns true if it is a valid Topic
     */
    public get isValid(): boolean {
        return this.title ? true : false;
    }

    /**
     * Constructor. Empty
     *
     * @param topic A CreateTopic
     */
    public constructor(topic: CreateTopic) {
        super(topic);
    }
}
