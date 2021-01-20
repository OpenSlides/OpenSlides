import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { Permission } from './core/core-services/operator.service';

/**
 * Provides functionalities that will be used by most components
 * currently able to set the title with the suffix ' - OpenSlides'
 *
 * A BaseComponent is an OpenSlides Component.
 * Components in the 'Side'- or 'projector' Folder are BaseComponents
 */
export abstract class BaseComponent {
    /**
     * To check permissions in templates using permission.[...]
     */
    public permission = Permission;

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
     * Determine to display a save hint
     */
    public saveHint: boolean;

    /**
     * Settings for the TinyMCE editor selector
     */
    public tinyMceSettings = {
        base_url: '/tinymce', // Root for resources
        suffix: '.min', // Suffix to use when loading resources
        theme: 'silver',
        language: null,
        language_url: null,
        inline: false,
        statusbar: false,
        browser_spellcheck: true,
        image_advtab: true,
        image_description: false,
        link_title: false,
        height: 320,
        plugins: `autolink charmap code fullscreen image imagetools
            lists link paste searchreplace`,
        menubar: false,
        contextmenu: false,
        toolbar: `styleselect | bold italic underline strikethrough |
            forecolor backcolor removeformat | bullist numlist |
            link image charmap | code fullscreen`,
        mobile: {
            theme: 'mobile',
            plugins: ['autosave', 'lists', 'autolink']
        },
        relative_urls: false,
        remove_script_host: true
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

    /**
     * TinyMCE Init callback. Used for certain mobile editors
     * @param event
     */
    protected onInitTinyMce(event: any): void {
        console.log('tinyMCE event: ', event);

        if (event.event.target.settings.theme === 'mobile') {
            console.log('is mobile editor');
            this.saveHint = true;
        } else {
            console.log('is no mobile editor');
            event.editor.focus();
        }
    }

    protected onLeaveTinyMce(event: any): void {
        console.log('tinyevent:', event.event.type);
        this.saveHint = false;
    }
}
