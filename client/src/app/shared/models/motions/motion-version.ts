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

    public constructor(input?: any) {
        this.title = '';
        this.text = '';
        this.reason = '';

        if (input) {
            this.deserialize(input);
        }
    }

    public deserialize(input: any): void {
        Object.assign(this, input);
    }
}
