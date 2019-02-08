import { BaseModel } from '../base/base-model';

/**
 * Representation of a topic.
 * @ignore
 */
export class Topic extends BaseModel<Topic> {
    public static COLLECTIONSTRING = 'topics/topic';

    public id: number;
    public title: string;
    public text: string;
    public attachments_id: number[];
    public agenda_item_id: number;

    public constructor(input?: any) {
        super(Topic.COLLECTIONSTRING, input);
    }
}
