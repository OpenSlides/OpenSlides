import { Deserializable } from '../deserializable.model';

/**
 * The name and the type of a mediaFile.
 * @ignore
 */
export class File implements Deserializable {
    name: string;
    type: string;

    /**
     * Needs to be fully optional, because the 'mediafile'-property in the mediaFile class is optional as well
     * @param name The name of the file
     * @param type The tape (jpg, png, pdf)
     */
    constructor(name?: string, type?: string) {
        this.name = name;
        this.type = type;
    }

    deserialize(input: any): this {
        Object.assign(this, input);
        return this;
    }
}
