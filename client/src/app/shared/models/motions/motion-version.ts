import { Deserializable } from '../deserializable.model';

/**
 * Representation of a Motion Version.
 *
 * @ignore
 */
export class MotionVersion implements Deserializable {
    public id: number;
    public version_number: number;
    public creation_time: string;
    public title: string;
    public text: string;
    public amendment_paragraphs: string;
    public reason: string;

    public constructor(
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
        this.title = title || '';
        this.text = text || '';
        this.amendment_paragraphs = amendment_paragraphs || '';
        this.reason = reason || '';
    }

    public deserialize(input: any): this {
        Object.assign(this, input);
        return this;
    }
}
