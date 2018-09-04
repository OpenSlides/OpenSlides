import { Deserializable } from '../deserializable.model';

/**
 * Representation of a Motion Version.
 *
 * @ignore
 */
export class MotionLog implements Deserializable {
    public message_list: string[];
    public person_id: number;
    public time: string;
    public message: string;

    public constructor(input?: any) {
        if (input) {
            this.deserialize(input);
        }
    }

    public deserialize(input: any): void {
        Object.assign(this, input);
    }
}
