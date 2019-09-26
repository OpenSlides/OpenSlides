import { BaseModelWithAgendaItemAndListOfSpeakers } from '../base/base-model-with-agenda-item-and-list-of-speakers';

/**
 * Representation of a topic.
 * @ignore
 */
export class Topic extends BaseModelWithAgendaItemAndListOfSpeakers<Topic> {
    public static COLLECTIONSTRING = 'topics/topic';

    public id: number;
    public title: string;
    public text: string;
    public attachments_id: number[];

    public constructor(input?: Partial<Topic>) {
        super(Topic.COLLECTIONSTRING, input);
    }
}
