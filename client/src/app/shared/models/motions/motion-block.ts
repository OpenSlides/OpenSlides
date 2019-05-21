import { BaseModelWithAgendaItemAndListOfSpeakers } from '../base/base-model-with-agenda-item-and-list-of-speakers';

/**
 * Representation of a motion block.
 * @ignore
 */
export class MotionBlock extends BaseModelWithAgendaItemAndListOfSpeakers<MotionBlock> {
    public static COLLECTIONSTRING = 'motions/motion-block';

    public id: number;
    public title: string;
    public internal: boolean;

    public constructor(input?: any) {
        super(MotionBlock.COLLECTIONSTRING, input);
    }
}
