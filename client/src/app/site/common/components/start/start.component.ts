import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core'; // showcase

import { BaseComponent } from 'app/base.component';

// for testing the DS and BaseModel
import { Config } from 'app/shared/models/core/config';
import { DataStoreService } from 'app/core/core-services/data-store.service';

@Component({
    selector: 'os-start',
    templateUrl: './start.component.html'
})
export class StartComponent extends BaseComponent implements OnInit {
    public welcomeTitle: string;
    public welcomeText: string;

    /**
     * Constructor of the StartComponent
     *
     * @param titleService the title serve
     * @param translate to translation module
     */
    public constructor(titleService: Title, protected translate: TranslateService, private DS: DataStoreService) {
        super(titleService, translate);
    }

    /**
     * Init the component.
     *
     * Sets the welcomeTitle and welcomeText.
     * Tries to read them from the DataStore (which will fail initially)
     * And observes DataStore for changes
     * Set title and observe DataStore for changes.
     */
    public ngOnInit(): void {
        // required dummy translation, cause translations for config values were never set
        // tslint:disable-next-line
        const welcomeTitleTranslateDummy = this.translate.instant('Welcome to OpenSlides');
        super.setTitle('Home');
        // set welcome title and text
        const welcomeTitleConfig = this.DS.filter<Config>(
            Config,
            config => config.key === 'general_event_welcome_title'
        )[0] as Config;

        if (welcomeTitleConfig) {
            this.welcomeTitle = welcomeTitleConfig.value as string;
        }

        const welcomeTextConfig = this.DS.filter<Config>(
            Config,
            config => config.key === 'general_event_welcome_text'
        )[0] as Config;

        if (welcomeTextConfig) {
            this.welcomeText = welcomeTextConfig.value as string;
        }

        // observe title and text in DS
        this.DS.changeObservable.subscribe(newModel => {
            if (newModel instanceof Config) {
                if (newModel.key === 'general_event_welcome_title') {
                    this.welcomeTitle = newModel.value as string;
                } else if (newModel.key === 'general_event_welcome_text') {
                    this.welcomeText = newModel.value as string;
                }
            }
        });
    }

    /**
     * test translations in component
     */
    public TranslateTest(): void {
        console.log('lets translate the word "motion" in the current in the current lang');
        console.log('Motions in ' + this.translate.currentLang + ' is ' + this.translate.instant('Motions'));
    }
}
