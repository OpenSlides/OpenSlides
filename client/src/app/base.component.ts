import { Title } from '@angular/platform-browser';
import { OpenSlidesComponent } from './openslides.component';
import { TranslateService } from '@ngx-translate/core';

/**
 * Provides functionalities that will be used by most components
 * currently able to set the title with the suffix ' - OpenSlides'
 *
 * A BaseComponent is an OpenSlides Component.
 * Components in the 'Side'- or 'projector' Folder are BaseComponents
 */
export abstract class BaseComponent extends OpenSlidesComponent {
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
        // TODO: language_url: '/static/tinymce/i18n/' + gettextCatalog.getCurrentLanguage() + '.js',
        // TODO: theme_url: '/static/js/openslides-libs.js',
        skin_url: '/assets/tinymce/skins/lightgray',
        inline: false,
        statusbar: false,
        browser_spellcheck: true,
        image_advtab: true,
        height: 320,
        // TODO: image_list: images,
        plugins: `autolink charmap code colorpicker fullscreen image imagetools
            lists link paste preview searchreplace textcolor`,
        menubar: '',
        toolbar: `undo redo searchreplace | styleselect | bold italic underline strikethrough
            | forecolor backcolor removeformat | bullist numlist | outdent indent |
            link image charmap table | code preview fullscreen`
    };

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
