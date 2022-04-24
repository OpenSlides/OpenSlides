import { Injectable } from '@angular/core';

import { ConfigService } from './config.service';
import { FontConfigObject } from './media-manage.service';

/**
 * Enables the usage of the FontFace constructor
 */
declare let FontFace: any;

/**
 * The linter refuses to allow Document['fonts'].
 * Since Document.fonts is working draft since 2016, typescript
 * does not yet support it natively (even though it exists in normal browsers)
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
     * Observes and loads custom fonts.
     * Falls back to the normal OSFont when no custom  font was set.
     */
    private loadCustomFont(): void {
        this.configService.get<FontConfigObject>('font_regular').subscribe(regular => {
            if (regular) {
                this.setCustomProjectorFont(regular, 400);
            }
        });

        this.configService.get<FontConfigObject>('font_bold').subscribe(bold => {
            if (bold) {
                this.setCustomProjectorFont(bold, 500);
            }
        });

        this.configService.get<FontConfigObject>('font_monospace').subscribe(mono => {
            if (mono) {
                this.setNewFontFace('OSFont Monospace', mono.path || mono.default);
            }
        });

        this.configService.get<FontConfigObject>('font_chyron_speaker_name').subscribe(chyronFont => {
            if (chyronFont) {
                this.setNewFontFace('OSFont ChyronName', chyronFont.path || chyronFont.default);
            }
        });

        this.configService.get<FontConfigObject>('projector_h1').subscribe(projectorH1 => {
            if (projectorH1) {
                this.setNewFontFace('OSFont projectorH1', projectorH1.path || projectorH1.default);
            }
        });

        this.configService.get<FontConfigObject>('projector_h2').subscribe(projectorH2 => {
            if (projectorH2) {
                this.setNewFontFace('OSFont projectorH2', projectorH2.path || projectorH2.default);
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
    private setCustomProjectorFont(font: FontConfigObject, weight: number): void {
        const path = font.path || font.default;
        if (!path) {
            return;
        }
        const url: string = font.path ? `${this.urlPrefix}${path}` : path;
        this.setNewFontFace('customProjectorFont', url, weight);
    }

    private setNewFontFace(fontName: string, fontPath: string, weight: number = 400): void {
        const customFont = new FontFace(fontName, `url(${fontPath})`, { weight: weight });
        customFont
            .load()
            .then(res => {
                (document as FontDocument).fonts.add(res);
            })
            .catch(error => {
                console.log(error);
            });
    }
}
