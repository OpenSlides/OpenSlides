import { Deserializer } from '../deserializer.model';

/**
 * Representation of a Motion Log.
 *
 * @ignore
 */
export class MotionLog extends Deserializer {
    public message_list: string[];
    public person_id: number;
    public time: string;
    public message: string;

    public constructor(input?: any) {
        super(input);
    }
}
