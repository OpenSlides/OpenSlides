import { Component } from '@angular/core';
import { OpenSlidesService } from 'app/core/core-services/openslides.service';

@Component({
    selector: 'os-legal-notice',
    templateUrl: './legal-notice.component.html'
})
export class LegalNoticeComponent {
    public constructor(private openSlidesService: OpenSlidesService) {}

    public resetCache(): void {
        this.openSlidesService.reset();
    }
}
