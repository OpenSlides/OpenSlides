import { Topic } from 'app/shared/models/topics/topic';

/**
 * Representation of Topic during creation.
 */
export class CreateTopic extends Topic {
    public attachments_id: number[];
    public agenda_type: number;
    public agenda_parent_id: number;
    public agenda_comment: string;
    public agenda_duration: number;
    public agenda_weight: number;

    public constructor(input?: any) {
        super(input);
    }

    /**
     * Checks if the CreateTopic is valid. Currently only requires an existing title
     *
     * @returns true if it is a valid Topic
     */
    public get isValid(): boolean {
        return this.title ? true : false;
    }
}
