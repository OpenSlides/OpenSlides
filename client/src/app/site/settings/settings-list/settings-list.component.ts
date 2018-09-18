import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { BaseComponent } from '../../../base.component';
import { ConstantsService } from '../../../core/services/constants.service';

/**
 * List view for the global settings
 *
 * TODO: Not yet implemented
 */
@Component({
    selector: 'os-settings-list',
    templateUrl: './settings-list.component.html',
    styleUrls: ['./settings-list.component.css']
})
export class SettingsListComponent extends BaseComponent implements OnInit {
    /**
     * The usual component constructor
     * @param titleService
     * @param translate
     */
    public constructor(
        titleService: Title,
        protected translate: TranslateService,
        private constantsService: ConstantsService
    ) {
        super(titleService, translate);
    }

    /**
     * Init function. Sets the title
     */
    public ngOnInit(): void {
        super.setTitle('Settings');

        this.constantsService.get('OpenSlidesConfigVariables').subscribe(data => {
            console.log(data);
        });
    }
}
