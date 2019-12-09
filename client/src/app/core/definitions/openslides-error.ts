import { retry } from 'rxjs/operators';

/**
 * Definition of treatable and untreatable errors
 * while running OpenSlides.
 * Services as generic class, instances can be converted to json and string
 */
export class OpenSlidesError extends Error {
    public constructor(message: string, name?: string) {
        super(message);
        this.name = name ? name : 'Error';
        // Set the prototype explicitly.
        Object.setPrototypeOf(this, OpenSlidesError.prototype);
    }

    public toJSON(): Object {
        const alt = {};

        Object.getOwnPropertyNames(this).forEach(key => {
            alt[key] = this[key];
        }, this);

        return alt;
    }
}
