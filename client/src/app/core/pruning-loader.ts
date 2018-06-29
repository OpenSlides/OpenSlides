import { TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators/';

/**
 * Translation loader that replaces empty strings with nothing.
 *
 * ngx-translate-extract writes empty strings into json files.
 * The problem is that these empty strings don't trigger
 * the MissingTranslationHandler - they are simply empty strings...
 *
 */
export class PruningTranslationLoader implements TranslateLoader {
    constructor(private http: HttpClient, private prefix: string = '/assets/i18n/', private suffix: string = '.json') {}

    public getTranslation(lang: string): any {
        return this.http.get(`${this.prefix}${lang}${this.suffix}`).pipe(map((res: Object) => this.process(res)));
    }

    private process(object: any) {
        const newObject = {};
        for (const key in object) {
            if (object.hasOwnProperty(key)) {
                if (typeof object[key] === 'object') {
                    newObject[key] = this.process(object[key]);
                } else if (typeof object[key] === 'string' && object[key] === '') {
                    // do not copy empty strings
                } else {
                    newObject[key] = object[key];
                }
            }
        }
        return newObject;
    }
}
