import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

/**
 * Provides functionalities that will be used by most components
 * currently able to set the title with the suffix ' - OpenSlides'
 *
 * A BaseComponent is an OpenSlides Component.
 * Components in the 'Side'- or 'projector' Folder are BaseComponents
 */
export abstract class BaseComponent {
    /**
     * To manipulate the browser title bar, adds the Suffix "OpenSlides"
     *
     * Might be a config variable later at some point
     */
    private titleSuffix = ' - OpenSlides';

    /**
     * Holds the coordinates where a swipe gesture was used
     */
    protected swipeCoord?: [number, number];

    /**
     * Holds the time when the user was swiping
     */
    protected swipeTime?: number;

    /**
     * Settings for the TinyMCE editor selector
     */
    public tinyMceSettings = {
        language: null,
        language_url: null,
        skin_url: '/assets/tinymce/skins/lightgray',
        inline: false,
        statusbar: false,
        browser_spellcheck: true,
        image_advtab: true,
        image_description: false,
        link_title: false,
        height: 320,
        // TODO: image_list: images,
        plugins: `autolink charmap code colorpicker fullscreen image imagetools
            lists link paste searchreplace textcolor`,
        menubar: '',
        toolbar: `styleselect | bold italic underline strikethrough |
            forecolor backcolor removeformat | bullist numlist |
            link image charmap | code fullscreen`
    };

    public constructor(protected titleService: Title, protected translate: TranslateService) {
        this.tinyMceSettings.language_url = '/assets/tinymce/langs/' + this.translate.currentLang + '.js';
        this.tinyMceSettings.language = this.translate.currentLang;
    }

    /**
     * Set the title in web browser using angulars TitleService
     * @param prefix The title prefix. Should be translated here.
     */
    public setTitle(prefix: string): void {
        const translatedPrefix = this.translate.instant(prefix);
        this.titleService.setTitle(translatedPrefix + this.titleSuffix);
    }

    /**
     * Helper for indexed *ngFor components
     *
     * @param index
     */
    public trackByIndex(index: number): number {
        return index;
    }
}
