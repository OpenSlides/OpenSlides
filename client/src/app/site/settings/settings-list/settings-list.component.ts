import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { ConstantsService } from '../../../core/services/constants.service';
import { ListViewBaseComponent } from '../../base/list-view-base';
import { ConfigRepositoryService } from '../services/config-repository.service';
import { ViewConfig } from '../models/view-config';

/**
 * List view for the global settings
 *
 */
@Component({
    selector: 'os-settings-list',
    templateUrl: './settings-list.component.html',
    styleUrls: ['./settings-list.component.css']
})
export class SettingsListComponent extends ListViewBaseComponent<ViewConfig> implements OnInit {
    /**
     * The usual component constructor
     * @param titleService
     * @param translate
     */
    public constructor(
        protected titleService: Title,
        protected translate: TranslateService,
        private repo: ConfigRepositoryService,
        private constantsService: ConstantsService,
    ) {
        super(titleService, translate);
    }

    /**
     * Init function.
     *
     * Sets the title, inits the table and calls the repo
     *
     * TODO: Needs the constants to be working
     */
    public ngOnInit(): void {
        super.setTitle('Settings');
        this.initTable();
        this.constantsService.get('OpenSlidesConfigVariables').subscribe(data => {
            console.log(data);
        });
        this.repo.getViewModelListObservable().subscribe(newConfig => {
            this.dataSource.data = newConfig;
        });
    }

    /**
     * Triggers when user selects a row
     * @param row
     *
     * TODO: This prints the clicked item in the log.
     *       Needs the constants to be working
     */
    public selectConfig(row: ViewConfig): void {
        console.log('change a config: ', row.value);
    }
}
