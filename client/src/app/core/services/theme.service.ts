import { Injectable } from '@angular/core';
import { ConfigService } from './config.service';

/**
 * Service to set the theme for the OpenSlides.
 * Reads related data from server,
 * the server sends the value of the new theme --> the new theme has only to be added to the body.
 */
@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    /**
     * Here it will subscribe to the observer from config-service to read data.
     *
     * @param configService must be injected to get the data from server.
     */
    public constructor(configService: ConfigService) {
        configService.get('openslides_theme').subscribe(newTheme => {
            // Listen to the related event.
            const classList = document.getElementsByTagName('body')[0].classList; // Get the classlist of the body.
            if (newTheme) {
                const toRemove = Array.from(classList).filter((item: string) => item.includes('theme'));
                if (toRemove.length) {
                    classList.remove(...toRemove); // Remove all old themes.
                }
                classList.add(newTheme); // Add the new theme.
            }
        });
    }
}
