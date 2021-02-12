import { Injectable } from '@angular/core';

import { LoginDataService } from './login-data.service';

/**
 * Constant, that describes the default theme class.
 */
export const OS_DEFAULT_THEME = 'openslides-default-light-theme';

/**
 * Constant path of the logo with dark colors for bright themes.
 */
export const OS_DEFAULT_LOGO = '/assets/img/openslides-logo.svg';

/**
 * Constant path of the logo with white colors for dark themes.
 */
export const OS_DEFAULT_LOGO_DARK_THEME = '/assets/img/openslides-logo-dark.svg';

/**
 * Service to set the theme for OpenSlides.
 */
@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    /**
     * Holds the current theme as member.
     */
    private currentTheme: string;

    /**
     * Here it will subscribe to the observer from login data service. The stheme is part of
     * the login data, so get it from there and not from the config. This service will
     * also cache the theme and provide the right theme on login.
     *
     * @param loginDataService must be injected to get the theme.
     */
    public constructor(loginDataService: LoginDataService) {
        loginDataService.theme.subscribe(newTheme => {
            if (!newTheme) {
                return;
            }
            this.changeTheme(newTheme);
        });
    }

    /**
     * Function to change the theme and ensures, that old themes are removed.
     *
     * @param theme The theme which is applied.
     */
    private changeTheme(theme: string): void {
        this.currentTheme = theme;

        const classList = document.getElementsByTagName('body')[0].classList; // Get the classlist of the body.
        const toRemove = Array.from(classList).filter((item: string) => item.includes('-theme'));
        if (toRemove.length) {
            classList.remove(...toRemove); // Remove all old themes.
        }
        classList.add(theme, OS_DEFAULT_THEME); // Add the new theme.
    }

    /**
     * Returns the logo relative to the used theme.
     *
     * @param shouldDefault If this method should return the default logo.
     *
     * @returns the path to the logo.
     */
    public getLogoRelativeToTheme(shouldDefault?: boolean): string {
        if (this.currentTheme) {
            return this.currentTheme.includes('dark') && !shouldDefault ? OS_DEFAULT_LOGO_DARK_THEME : OS_DEFAULT_LOGO;
        } else {
            return null;
        }
    }
}
