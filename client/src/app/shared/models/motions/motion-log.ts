import { Deserializer } from '../base/deserializer';

/**
 * Representation of a Motion Log.
 * TODO: better documentation
 *
 * @ignore
 */
export class MotionLog extends Deserializer {
    public message_list: string[];
    public person_id: number;
    public time: string;
    public message: string; // a pre-translated message in the servers' defined language

    public constructor(input?: any) {
        super(input);
    }
}
