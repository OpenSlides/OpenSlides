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
        toolbar: `styleselect | bold italic underline strikethrough
            | forecolor backcolor removeformat | bullist numlist |
            link image charmap | code fullscreen`
    };

    public constructor(protected titleService?: Title, protected translate?: TranslateService) {
        if (this.translate) {
            this.tinyMceSettings.language_url = '/assets/tinymce/langs/' + this.translate.currentLang + '.js';
            this.tinyMceSettings.language = this.translate.currentLang;
        }
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
