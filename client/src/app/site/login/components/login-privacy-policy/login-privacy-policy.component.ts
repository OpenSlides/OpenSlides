import { Component, OnInit } from '@angular/core';

/**
 * Container to display the privacy policy on the login page.
 * Uses the corresponding shared component
 */
@Component({
    selector: 'os-login-privacy-policy',
    templateUrl: './login-privacy-policy.component.html',
    styleUrls: ['../../assets/login-info-pages.scss']
})
export class LoginPrivacyPolicyComponent implements OnInit {
    /**
     * Empty Constructor
     */
    public constructor() {}

    /**
     * Empty onInit
     */
    public ngOnInit(): void {}
}
