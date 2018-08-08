import { Deserializable } from '../deserializable.model';

/**
 * Representation of a Motion Version.
 *
 * @ignore
 */
export class MotionVersion implements Deserializable {
    id: number;
    version_number: number;
    creation_time: string;
    title: string;
    text: string;
    amendment_paragraphs: string;
    reason: string;

    constructor(
        id?: number,
        version_number?: number,
        creation_time?: string,
        title?: string,
        text?: string,
        amendment_paragraphs?: string,
        reason?: string
    ) {
        this.id = id;
        this.version_number = version_number;
        this.creation_time = creation_time;
        this.title = title;
        this.text = text;
        this.amendment_paragraphs = amendment_paragraphs;
        this.reason = reason;
    }

    deserialize(input: any): this {
        Object.assign(this, input);
        return this;
    }
}
