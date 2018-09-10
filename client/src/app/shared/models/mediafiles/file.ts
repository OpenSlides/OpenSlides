import { Deserializer } from '../deserializer.model';

/**
 * The name and the type of a mediaFile.
 * @ignore
 */
export class File extends Deserializer {
    public name: string;
    public type: string;

    /**
     * Needs to be fully optional, because the 'mediafile'-property in the mediaFile class is optional as well
     * @param name The name of the file
     * @param type The tape (jpg, png, pdf)
     */
    public constructor(input?: any) {
        super(input);
    }
}
