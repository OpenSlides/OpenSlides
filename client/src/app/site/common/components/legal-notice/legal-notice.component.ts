import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { OpenSlidesService } from 'app/core/core-services/openslides.service';
import { OperatorService } from 'app/core/core-services/operator.service';
import { ConfigRepositoryService } from 'app/core/repositories/config/config-repository.service';
import { ErrorService } from 'app/core/ui-services/error.service';
import { UpdateService } from 'app/core/ui-services/update.service';
import { BaseViewComponent } from 'app/site/base/base-view';

@Component({
    selector: 'os-legal-notice',
    templateUrl: './legal-notice.component.html'
})
export class LegalNoticeComponent extends BaseViewComponent implements OnInit {
    /**
     * Whether this component is in editing-mode.
     */
    public isEditing = false;

    /**
     * Holds the current legal-notice.
     */
    public legalNotice = '';

    /**
     * Constructor.
     */
    public constructor(
        title: Title,
        protected translate: TranslateService,
        matSnackBar: MatSnackBar,
        errorService: ErrorService,
        private openSlidesService: OpenSlidesService,
        private update: UpdateService,
        private configRepo: ConfigRepositoryService,
        private operator: OperatorService
    ) {
        super(title, translate, matSnackBar, errorService);
    }

    public ngOnInit(): void {
        super.setTitle(this.translate.instant('Legal notice'));
    }

    public resetCache(): void {
        this.openSlidesService.reset();
    }

    public checkForUpdate(): void {
        this.update.checkForUpdate();
    }

    public initiateUpdateCheckForAllClients(): void {
        this.update.initiateUpdateCheckForAllClients();
    }

    /**
     * Saves changes.
     */
    public saveChanges(): void {
        this.configRepo
            .bulkUpdate([{ key: 'general_event_legal_notice', value: this.legalNotice }])
            .then(() => (this.isEditing = !this.isEditing), this.raiseError);
    }

    /**
     * Returns, if the current user has the necessary permissions.
     */
    public canManage(): boolean {
        return this.operator.hasPerms('core.can_manage_config');
    }
}
