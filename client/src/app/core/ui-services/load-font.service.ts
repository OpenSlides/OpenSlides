import { Injectable } from '@angular/core';

import { ConfigService } from './config.service';

/**
 * Enables the usage of the FontFace constructor
 */
declare let FontFace: any;

/**
 * The linter refuses to allow Document['fonts'].
 * Since Document.fonts is working draft since 2016, typescript
 * dies not yet support it natively (even though it exists in normal browsers)
 */
interface FontDocument extends Document {
    fonts: any;
}

/**
 * Service to dynamically load and sets custom loaded fonts
 * using FontFace.
 * Browser support might not be perfect yet.
 */
@Injectable({
    providedIn: 'root'
})
export class LoadFontService {
    /**
     * The prefix to load custom fonts from
     */
    private urlPrefix = window.location.origin;

    /**
     * Constructor
     *
     * @param configService To observe the config variables
     */
    public constructor(private configService: ConfigService) {
        this.loadCustomFont();
    }

    /**
     * Observes and loads custom fonts for the projector.
     * Currently, normal and regular fonts can be considered, since
     * italic fonts can easily be calculated by the browser.
     * Falls back to the normal OSFont when no custom  font was set.
     */
    private loadCustomFont(): void {
        this.configService.get<any>('font_regular').subscribe(regular => {
            if (regular) {
                this.setCustomProjectorFont(regular, 400);
            }
        });

        this.configService.get<any>('font_bold').subscribe(bold => {
            if (bold) {
                this.setCustomProjectorFont(bold, 500);
            }
        });
    }

    /**
     * Sets a new font for the custom projector. Weight is required to
     * differentiate between bold and normal fonts
     *
     * @param font the font object from the config service
     * @param weight the desired weight of the font
     */
    private setCustomProjectorFont(font: any, weight: number): void {
        const path = font.path ? font.path : font.default;
        if (!path) {
            return;
        }
        const url = font.path ? `${this.urlPrefix}${path}` : path;
        const fontFace = new FontFace('customProjectorFont', `url(${url})`, { weight: weight });
        fontFace
            .load()
            .then(res => {
                (document as FontDocument).fonts.add(res);
            })
            .catch(error => {
                console.error(error);
            });
    }
}
