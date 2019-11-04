import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { BaseComponent } from 'app/base.component';
import { ConfigRepositoryService } from 'app/core/repositories/config/config-repository.service';
import { PromptService } from 'app/core/ui-services/prompt.service';

/**
 * List view for the global settings
 */
@Component({
    selector: 'os-config-overview',
    templateUrl: './config-overview.component.html',
    styleUrls: ['./config-overview.component.scss']
})
export class ConfigOverviewComponent extends BaseComponent implements OnInit {
    public groups: string[] = [];

    public constructor(
        protected titleService: Title,
        protected translate: TranslateService,
        public repo: ConfigRepositoryService,
        private promptDialog: PromptService
    ) {
        super(titleService, translate);
    }

    /**
     * Sets the title, inits the table and calls the repo
     */
    public ngOnInit(): void {
        super.setTitle('Settings');

        this.repo.availableGroupsOberservable.subscribe(groups => {
            this.groups = groups;
        });
    }

    /**
     * Resets every config for all registered group.
     */
    public async resetAll(): Promise<void> {
        const title = this.translate.instant(
            'Are you sure you want to reset all options to factory defaults? Changes of all settings group will be lost!'
        );
        if (await this.promptDialog.open(title)) {
            await this.repo.resetGroups(this.groups);
        }
    }
}
