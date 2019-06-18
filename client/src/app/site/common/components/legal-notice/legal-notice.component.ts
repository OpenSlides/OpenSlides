import { Component, OnInit } from '@angular/core';
import { OpenSlidesService } from 'app/core/core-services/openslides.service';
import { UpdateService } from 'app/core/ui-services/update.service';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'os-legal-notice',
    templateUrl: './legal-notice.component.html'
})
export class LegalNoticeComponent implements OnInit {
    public constructor(
        private openSlidesService: OpenSlidesService,
        private update: UpdateService,
        private titleService: Title,
        private translate: TranslateService
    ) {}

    public ngOnInit(): void {
        this.titleService.setTitle(this.translate.instant('Legal notice'));
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
}
