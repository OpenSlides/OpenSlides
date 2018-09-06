import { Component, OnInit } from '@angular/core';
import { LoginDataService } from '../../core/services/login-data.service';
import { TranslateService } from '@ngx-translate/core';
import { Location } from '@angular/common';

@Component({
    selector: 'os-privacy-policy',
    templateUrl: './privacy-policy.component.html',
    styleUrls: ['./privacy-policy.component.scss']
})
export class PrivacyPolicyComponent implements OnInit {
    public privacyPolicy: string;

    public constructor(
        private loginDataService: LoginDataService,
        private translate: TranslateService,
        private location: Location
    ) {}

    public ngOnInit() {
        this.loginDataService.privacy_policy.subscribe(privacyPolicy => {
            if (privacyPolicy) {
                this.privacyPolicy = this.translate.instant(privacyPolicy);
            }
        });
    }

    public goBack(): void {
        this.location.back();
    }
}
