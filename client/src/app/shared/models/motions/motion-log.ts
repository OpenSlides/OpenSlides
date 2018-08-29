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

    public constructor(message_list?: string[], person_id?: number, time?: string, message?: string) {
        this.message_list = message_list;
        this.person_id = person_id;
        this.time = time;
        this.message = message;
    }

    public deserialize(input: any): this {
        Object.assign(this, input);
        return this;
    }
}
