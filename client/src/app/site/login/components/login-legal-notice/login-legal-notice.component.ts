import { Component, OnInit } from '@angular/core';

/**
 * Container to display the legal notice on the login page.
 * Uses the corresponding shared component
 */
@Component({
    selector: 'os-login-legal-notice',
    templateUrl: './login-legal-notice.component.html',
    styleUrls: ['../../assets/login-info-pages.scss']
})
export class LoginLegalNoticeComponent implements OnInit {
    /**
     * Empty constructor
     */
    public constructor() {}

    /**
     * Empty onInit
     */
    public ngOnInit(): void {}
}
