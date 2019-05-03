import { Component } from '@angular/core';
import { OpenSlidesService } from 'app/core/core-services/openslides.service';
import { UpdateService } from 'app/core/ui-services/update.service';

@Component({
    selector: 'os-legal-notice',
    templateUrl: './legal-notice.component.html'
})
export class LegalNoticeComponent {
    public constructor(private openSlidesService: OpenSlidesService, private update: UpdateService) {}

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
