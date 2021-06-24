import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { environment } from 'environments/environment.prod';

import { BaseComponent } from 'app/base.component';
import { HttpService } from 'app/core/core-services/http.service';
import { OperatorService } from 'app/core/core-services/operator.service';
import { ConfigRepositoryService } from 'app/core/repositories/config/config-repository.service';
import { FileExportService } from 'app/core/ui-services/file-export.service';
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
        private promptDialog: PromptService,
        private http: HttpService,
        private exporter: FileExportService,
        private operator: OperatorService
    ) {
        super(titleService, translate);
    }

    public isSuperAdmin(): boolean {
        return this.operator.isSuperAdmin;
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

    public async exportToOS4(): Promise<void> {
        const data = await this.http.get<any>(environment.urlPrefix + '/core/os4-export/');
        const json = JSON.stringify(data, null, 2);
        this.exporter.saveFile(json, 'export.json', 'application/json');
    }
}
