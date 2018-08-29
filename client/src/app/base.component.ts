import { Title } from '@angular/platform-browser';
import { OpenSlidesComponent } from './openslides.component';
import { TranslateService } from '@ngx-translate/core';

/**
 * Provides functionalities that will be used by most components
 * currently able to set the title with the suffix ' - OpenSlides 3'
 *
 * A BaseComponent is an OpenSlides Component.
 * Components in the 'Side'- or 'projector' Folder are BaseComponents
 */
export abstract class BaseComponent extends OpenSlidesComponent {
    /**
     * To manipulate the browser title bar, adds the Suffix "OpenSlides 3"
     *
     * Might be a config variable later at some point
     */
    private titleSuffix = ' - OpenSlides 3';

    /**
     * Child constructor that implements the titleServices and calls Super from OpenSlidesComponent
     */
    public constructor(protected titleService?: Title, protected translate?: TranslateService) {
        super();
    }

    /**
     * Set the title in web browser using angulars TitleService
     * @param prefix The title prefix. Should be translated here.
     * TODO Might translate the prefix here?
     */
    public setTitle(prefix: string): void {
        const translatedPrefix = this.translate.instant(prefix);
        this.titleService.setTitle(translatedPrefix + this.titleSuffix);
    }
}
