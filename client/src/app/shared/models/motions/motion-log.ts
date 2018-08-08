import { Deserializable } from '../deserializable.model';

/**
 * Representation of a Motion Version.
 *
 * @ignore
 */
export class MotionLog implements Deserializable {
    message_list: string[];
    person_id: number;
    time: string;
    message: string;

    constructor(message_list?: string[], person_id?: number, time?: string, message?: string) {
        this.message_list = message_list;
        this.person_id = person_id;
        this.time = time;
        this.message = message;
    }

    deserialize(input: any): this {
        Object.assign(this, input);
        return this;
    }
}
