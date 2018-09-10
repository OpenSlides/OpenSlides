import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/**
 * Reusable footer Apps.
 *
 * ## Examples:
 *
 * ### Usage of the selector:
 *
 * ```html
 * <os-footer></os-footer>
 * ```
 */
@Component({
    selector: 'os-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
    /**
     * Indicates to location of the legal notice
     */
    public legalNoticeUrl = '/legalnotice';

    /**
     * Indicated the location of the privacy policy
     */
    public privacyPolicyUrl = '/privacypolicy';

    /**
     * Empty constructor
     */
    public constructor(private route: ActivatedRoute) {}

    /**
     * If on login page, redirect the legal notice and privacy policy not to /URL
     * but to /login/URL
     */
    public ngOnInit() {
        if (this.route.snapshot.url[0] && this.route.snapshot.url[0].path === 'login') {
            this.legalNoticeUrl = '/login/legalnotice';
            this.privacyPolicyUrl = '/login/privacypolicy';
        }
    }
}
