import { Component, OnInit } from '@angular/core';

import { LoginDataService } from 'app/core/ui-services/login-data.service';
import { environment } from 'environments/environment';
import { HttpService } from 'app/core/core-services/http.service';

/**
 * Characterize a plugin. This data is retrieved from the server
 */
interface PluginDescription {
    /**
     * The name of the plugin
     */
    verbose_name: string;

    /**
     * the version
     */
    version: string;

    /**
     * The url to the main webpage of the plugin
     */
    url: string;

    /**
     * The license
     */
    license: string;
}

/**
 * Represents metadata about the current installation.
 */
interface VersionResponse {
    /**
     * The lience string. Like 'MIT', 'GPLv2', ...
     */
    openslides_license: string;

    /**
     * The URl to the main webpage of OpenSlides.
     */
    openslides_url: string;

    /**
     * The current version.
     */
    openslides_version: string;

    /**
     * A list of installed plugins.
     */
    plugins: PluginDescription[];
}

/**
 * Shared component to hold the content of the Legal notice.
 * Used in login and site container.
 */
@Component({
    selector: 'os-legal-notice-content',
    templateUrl: './legal-notice-content.component.html',
    styleUrls: ['./legal-notice-content.component.scss']
})
export class LegalNoticeContentComponent implements OnInit {
    /**
     * The legal notive text for the ui.
     */
    public legalNotice: string;

    /**
     * Holds the version info retrieved from the server for the ui.
     */
    public versionInfo: VersionResponse;

    /**
     * Imports the LoginDataService, the translations and and HTTP Service
     * @param loginDataService
     * @param translate
     * @param http
     */
    public constructor(private loginDataService: LoginDataService, private http: HttpService) {}

    /**
     * Subscribes for the legal notice text.
     */
    public ngOnInit(): void {
        this.loginDataService.legalNotice.subscribe(legalNotice => {
            this.legalNotice = legalNotice;
        });

        // Query the version info.
        this.http.get<VersionResponse>(environment.urlPrefix + '/core/version/', {}).then(
            info => {
                this.versionInfo = info;
            },
            () => {
                // TODO: error handling if the version info could not be loaded
            }
        );
    }
}
