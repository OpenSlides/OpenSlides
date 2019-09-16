import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core'; // showcase

import { BaseComponent } from 'app/base.component';
import { ConfigService } from 'app/core/ui-services/config.service';

/**
 * The start component. Greeting page for OpenSlides
 */
@Component({
    selector: 'os-start',
    templateUrl: './start.component.html',
    styleUrls: ['./start.component.scss']
})
export class StartComponent extends BaseComponent implements OnInit {
    public welcomeTitle: string;
    public welcomeText: string;

    /**
     * Constructor of the StartComponent
     *
     * @param titleService the title serve
     * @param translate to translation module
     * @param configService read out config values
     */
    public constructor(titleService: Title, translate: TranslateService, private configService: ConfigService) {
        super(titleService, translate);
    }

    /**
     * Init the component.
     *
     * Sets the welcomeTitle and welcomeText.
     */
    public ngOnInit(): void {
        super.setTitle('Home');

        // set the welcome title
        this.configService
            .get<string>('general_event_welcome_title')
            .subscribe(welcomeTitle => (this.welcomeTitle = welcomeTitle));

        // set the welcome text
        this.configService.get<string>('general_event_welcome_text').subscribe(welcomeText => {
            this.welcomeText = this.translate.instant(welcomeText);
        });
    }
}
