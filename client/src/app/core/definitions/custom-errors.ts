import { marker as _ } from '@biesbjerg/ngx-translate-extract-marker';

/**
 * Define custom error classes here
 */

export class PreventedInDemo extends Error {
    public constructor(message: string = _('Cannot do that in demo mode!'), name: string = 'Error') {
        super(message);
        this.name = name;
        Object.setPrototypeOf(this, PreventedInDemo.prototype);
    }
}
