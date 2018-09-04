import { Component, OnInit } from '@angular/core';
import { ConfigService } from '../../core/services/config.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'os-legal-notice',
    templateUrl: './legal-notice.component.html',
    styleUrls: ['./legal-notice.component.scss']
})
export class LegalNoticeComponent implements OnInit {
    public legalNotice: string;

    public constructor(private configService: ConfigService, private translate: TranslateService) {}

    public ngOnInit() {
        this.configService.get('general_event_legal_notice').subscribe(value => {
            if (value) {
                this.legalNotice = this.translate.instant(value);
            }
        });
    }
}
