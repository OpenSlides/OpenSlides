import { Inject, Injectable, Optional } from '@angular/core';
import {
    MatMomentDateAdapterOptions,
    MAT_MOMENT_DATE_ADAPTER_OPTIONS,
    MomentDateAdapter
} from '@angular/material-moment-adapter';
import { MAT_DATE_LOCALE } from '@angular/material/core';

import { LangChangeEvent, TranslateService } from '@ngx-translate/core';

/**
 * A custom DateAdapter for the datetimepicker in the config. Uses MomentDateAdapter for localisation.
 * Is needed to subscribe to language changes
 */
@Injectable()
export class OpenSlidesDateAdapter extends MomentDateAdapter {
    public constructor(
        translate: TranslateService,
        @Optional() @Inject(MAT_DATE_LOCALE) dateLocale: string,
        @Optional() @Inject(MAT_MOMENT_DATE_ADAPTER_OPTIONS) _options?: MatMomentDateAdapterOptions
    ) {
        super(dateLocale, _options);
        // subscribe to language changes to change localisation of dates accordingly
        // DateAdapter seems not to be a singleton so we do that in this subclass instead of app.component
        this.setLocale(translate.currentLang);
        translate.onLangChange.subscribe((e: LangChangeEvent) => {
            this.setLocale(e.lang);
        });
    }
}
