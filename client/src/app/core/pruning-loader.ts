import { TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators/';
import { Observable } from 'rxjs';

/**
 * Translation loader that replaces empty strings with nothing.
 *
 * ngx-translate-extract writes empty strings into json files.
 * The problem is that these empty strings don't trigger
 * the MissingTranslationHandler - they are simply empty strings...
 *
 */
export class PruningTranslationLoader implements TranslateLoader {
    /**
     * Constructor to load the HttpClient
     *
     * @param http httpClient to load the translation files.
     * @param prefix Path to the language files. Can be adjusted of needed
     * @param suffix Suffix of the translation files. Usually '.json'.
     */
    public constructor(
        private http: HttpClient,
        private prefix: string = '/assets/i18n/',
        private suffix: string = '.json'
    ) {}

    /**
     * Loads a language file, stores the content, give it to the process function.
     * @param lang language string (en, fr, de, ...)
     */
    public getTranslation(lang: string): Observable<any> {
        return this.http.get(`${this.prefix}${lang}${this.suffix}`).pipe(map((res: Object) => this.process(res)));
    }

    /**
     * Prevent to display empty strings as a translation.
     * Falls back to the default language or simply copy the content of the key.
     * @param any the content of any language file.
     */
    private process(object: any): any {
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
