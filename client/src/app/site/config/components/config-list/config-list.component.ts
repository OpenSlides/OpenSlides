import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { BaseComponent } from 'app/base.component';
import { ConfigGroup, ConfigRepositoryService } from 'app/core/repositories/config/config-repository.service';

/**
 * List view for the global settings
 */
@Component({
    selector: 'os-config-list',
    templateUrl: './config-list.component.html',
    styleUrls: ['./config-list.component.scss']
})
export class ConfigListComponent extends BaseComponent implements OnInit {
    public configs: ConfigGroup[];

    public constructor(
        protected titleService: Title,
        protected translate: TranslateService,
        private repo: ConfigRepositoryService
    ) {
        super(titleService, translate);
    }

    /**
     * Sets the title, inits the table and calls the repo
     */
    public ngOnInit(): void {
        super.setTitle('Settings');

        this.repo.getConfigListObservable().subscribe(configs => {
            this.configs = configs;
        });
    }
}
