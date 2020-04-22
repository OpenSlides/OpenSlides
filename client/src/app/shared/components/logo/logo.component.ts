import { Component, Input, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { LoginDataService } from 'app/core/ui-services/login-data.service';
import { ThemeService } from 'app/core/ui-services/theme.service';

/**
 * Component to hold the logo for the app.
 */
@Component({
    selector: 'os-logo',
    templateUrl: './logo.component.html',
    styleUrls: ['./logo.component.scss']
})
export class LogoComponent implements OnInit, OnDestroy {
    /**
     * Local variable to hold the path for a custom web header.
     */
    private logoPath: string;

    /**
     * Local variable to hold the subscription to unsubscribe if exists.
     */
    private logoSubscription: Subscription;

    /**
     * determines if the current picture is displayed in the footer.
     * Optional.
     */
    @Input()
    public footer = false;

    /**
     * The constructor
     *
     * @param loginDataService Reference to the `LoginDataService`
     * @param themeService Reference to the `ThemeService`
     */
    public constructor(private loginDataService: LoginDataService, private themeService: ThemeService) {}

    /**
     * On init method
     */
    public ngOnInit(): void {
        this.logoSubscription = this.loginDataService.logoWebHeader.subscribe(nextLogo => {
            if (nextLogo) {
                this.logoPath = nextLogo.path;
            }
        });
    }

    /**
     * On destroy method
     */
    public ngOnDestroy(): void {
        if (this.logoSubscription) {
            this.logoSubscription.unsubscribe();
            this.logoSubscription = null;
        }
    }

    /**
     * Get the image based on custom images and footer.
     * If a custom image is set and this component is displayed as footer or there is no custom image, then the
     * OpenSlides logo is used.
     *
     * @returns path to image
     */
    public getImage(shouldDefault?: boolean): string {
        if ((!this.logoPath && !this.footer) || (!!this.logoPath && this.footer)) {
            return this.themeService.getLogoRelativeToTheme(shouldDefault);
        } else {
            return this.logoPath;
        }
    }
}
