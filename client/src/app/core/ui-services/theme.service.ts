import { Injectable } from '@angular/core';

import { LoginDataService } from './login-data.service';

/**
 * Service to set the theme for OpenSlides.
 */
@Injectable({
    providedIn: 'root'
})
export class ThemeService {
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

            const classList = document.getElementsByTagName('body')[0].classList; // Get the classlist of the body.
            const toRemove = Array.from(classList).filter((item: string) => item.includes('theme'));
            if (toRemove.length) {
                classList.remove(...toRemove); // Remove all old themes.
            }
            classList.add(newTheme); // Add the new theme.
        });
    }
}
