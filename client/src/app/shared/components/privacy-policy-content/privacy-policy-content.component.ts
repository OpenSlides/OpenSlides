import { Component, OnInit } from '@angular/core';

import { LoginDataService } from 'app/core/ui-services/login-data.service';

/**
 * Shared component to hold the content of the Privacy Policy.
 * Used in login and site container.
 */
@Component({
    selector: 'os-privacy-policy-content',
    templateUrl: './privacy-policy-content.component.html',
    styleUrls: ['./privacy-policy-content.component.scss']
})
export class PrivacyPolicyContentComponent implements OnInit {
    /**
     * The actual privacy policy as string
     */
    public privacyPolicy: string;

    /**
     * Imports the loginDataService and the translation service
     * @param loginDataService Login Data
     * @param translate for the translation
     */
    public constructor(private loginDataService: LoginDataService) {}

    /**
     * Subscribes for the privacy policy text
     */
    public ngOnInit(): void {
        this.loginDataService.privacyPolicy.subscribe(privacyPolicy => {
            this.privacyPolicy = privacyPolicy;
        });
    }
}
