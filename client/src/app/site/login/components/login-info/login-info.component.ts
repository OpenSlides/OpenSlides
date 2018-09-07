import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'os-login-info',
    templateUrl: './login-info.component.html',
    styleUrls: ['./login-info.component.scss']
})
export class LoginInfoComponent implements OnInit {
    /**
     * triggers what component to show
     */
    public component: string;

    /**
     * Determine the title of the page
     */
    public pageTitle: string;

    /**
     * Imports advanced Router
     * @param route
     */
    public constructor(private route: ActivatedRoute) {}

    /**
     * Small info wrapper.
     *
     * Takes an URL and decides what information to show.
     */
    public ngOnInit() {
        if (this.route.snapshot.url[0]) {
            if (this.route.snapshot.url[0].path === 'legalnotice') {
                this.pageTitle = 'Legal Notice';
                this.component = 'legalnotice';
            } else if (this.route.snapshot.url[0].path === 'privacypolicy') {
                this.pageTitle = 'Privacy Policy';
                this.component = 'privacypolicy';
            }
        }
    }
}
