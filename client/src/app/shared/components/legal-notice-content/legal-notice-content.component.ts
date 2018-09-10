import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LoginDataService } from '../../../core/services/login-data.service';
import { environment } from 'environments/environment';
import { HttpClient } from '@angular/common/http';

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
 * Shared component to hold the content of the Legal Notice.
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
    public constructor(
        private loginDataService: LoginDataService,
        private translate: TranslateService,
        private http: HttpClient
    ) {}

    /**
     * Subscribes for the legal notice text.
     */
    public ngOnInit() {
        this.loginDataService.legal_notice.subscribe(legalNotice => {
            if (legalNotice) {
                this.legalNotice = this.translate.instant(legalNotice);
                console.log('Init legal notice : ', legalNotice);
            }
        });

        // Query the version info.
        this.http
            .get<VersionResponse>(environment.urlPrefix + '/core/version/', {})
            .subscribe((info: VersionResponse) => {
                this.versionInfo = info;
            });
    }
}
