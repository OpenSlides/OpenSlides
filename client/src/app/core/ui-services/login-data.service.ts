import { EventEmitter, Injectable } from '@angular/core';

import { environment } from 'environments/environment.prod';
import { BehaviorSubject, Observable } from 'rxjs';
import { auditTime } from 'rxjs/operators';

import { ConfigService } from './config.service';
import { ConstantsService } from '../core-services/constants.service';
import { HttpService } from '../core-services/http.service';
import { OpenSlidesStatusService } from '../core-services/openslides-status.service';
import { StorageService } from '../core-services/storage.service';
import { OS_DEFAULT_THEME } from './theme.service';

interface SamlSettings {
    loginButtonText: string;
    changePasswordUrl: string;
}

/**
 * The login data send by the server.
 */
export interface LoginData {
    privacy_policy?: string;
    legal_notice?: string;
    theme: string;
    logo_web_header: {
        path: string;
        display_name: string;
    };
    login_info_text?: string;
    saml_settings?: SamlSettings;
}

/**
 * Checks, if the given object holds valid LoginData.
 *
 * @param obj The object to check
 */
function isLoginData(obj: any): obj is LoginData {
    return !!obj && obj.theme && obj.logo_web_header;
}

const LOGIN_DATA_STORAGE_KEY = 'LoginData';

/**
 * This service holds the privacy policy, the legal notice and the OpenSlides theme, so
 * they are available even if the user is not logged in.
 */
@Injectable({
    providedIn: 'root'
})
export class LoginDataService {
    /**
     * Holds the installation notice.
     */
    private readonly _loginInfoText = new BehaviorSubject<string>('');

    /**
     * Returns the installation notice as observable.
     */
    public get loginInfoText(): Observable<string> {
        return this._loginInfoText.asObservable();
    }

    /**
     * Holds the privacy policy
     */
    private readonly _privacyPolicy = new BehaviorSubject<string>('');

    /**
     * Returns an observable for the privacy policy
     */
    public get privacyPolicy(): Observable<string> {
        return this._privacyPolicy.asObservable();
    }

    /**
     * Holds the legal notice
     */
    private readonly _legalNotice = new BehaviorSubject<string>('');

    /**
     * Returns an observable for the legal notice
     */
    public get legalNotice(): Observable<string> {
        return this._legalNotice.asObservable();
    }

    /**
     * Holds the theme
     */
    private readonly _theme = new BehaviorSubject<string>(OS_DEFAULT_THEME);

    /**
     * Returns an observable for the theme
     */
    public get theme(): Observable<string> {
        return this._theme.asObservable();
    }

    /**
     * Holds the custom web header
     */
    private readonly _logoWebHeader = new BehaviorSubject<{ path: string; display_name: string }>({
        path: '',
        display_name: ''
    });

    /**
     * Returns an observable for the web header
     */
    public get logoWebHeader(): Observable<{ path: string; display_name: string }> {
        return this._logoWebHeader.asObservable();
    }

    private readonly _samlSettings = new BehaviorSubject<SamlSettings>(undefined);
    public get samlSettings(): Observable<SamlSettings> {
        return this._samlSettings.asObservable();
    }

    /**
     * Emit this event, if the current login data should be stored. This
     * is debounced to minimize requests to the storage service.
     */
    private storeLoginDataRequests = new EventEmitter<void>();

    /**
     * Holds, if `_refresh` can be called. This will be true fter the setup.
     */
    private canRefresh = false;

    /**
     * Marks, if during the etup (with `canRefresh=false`) a refresh was requested.
     * After the setup, this variabel will be checked and a refresh triggered, if it is true.
     */
    private markRefresh = false;

    /**
     * Constructs this service. The config service is needed to update the privacy
     * policy and legal notice, when their config values change.
     * @param configService
     */
    public constructor(
        private configService: ConfigService,
        private storageService: StorageService,
        private OSStatus: OpenSlidesStatusService,
        private httpService: HttpService,
        private constantsService: ConstantsService
    ) {
        this.storeLoginDataRequests.pipe(auditTime(100)).subscribe(() => this.storeLoginData());
        this.setup();
    }

    /**
     * Loads the login data and *after* that the configs are subscribed. If a request for a refresh
     * was issued while the setup, the refresh will be executed afterwards.
     */
    private async setup(): Promise<void> {
        await this.loadLoginData();
        this.configService.get<string>('general_event_privacy_policy').subscribe(value => {
            if (value !== undefined) {
                this._privacyPolicy.next(value);
                this.storeLoginDataRequests.next();
            }
        });
        this.configService.get<string>('general_event_legal_notice').subscribe(value => {
            if (value !== undefined) {
                this._legalNotice.next(value);
                this.storeLoginDataRequests.next();
            }
        });
        this.configService.get<string>('openslides_theme').subscribe(value => {
            if (value) {
                this._theme.next(value);
                this.storeLoginDataRequests.next();
            }
        });
        this.configService.get<{ path: string; display_name: string }>('logo_web_header').subscribe(value => {
            if (value) {
                this._logoWebHeader.next(value);
                this.storeLoginDataRequests.next();
            }
        });
        this.constantsService.get<SamlSettings>('SamlSettings').subscribe(value => {
            if (value !== undefined) {
                this._samlSettings.next(value);
                this.storeLoginDataRequests.next();
            }
        });
        this.canRefresh = true;
        if (this.markRefresh) {
            this._refresh();
        }
    }

    /**
     * Explicit refresh the ata from the server.
     */
    public refresh(): void {
        if (this.canRefresh && !this.markRefresh) {
            this._refresh();
        } else if (!this.canRefresh) {
            this.markRefresh = true;
        }
    }

    /**
     * The actual refresh implementation.
     */
    private async _refresh(): Promise<void> {
        try {
            const loginData = await this.httpService.get<LoginData>(environment.urlPrefix + '/users/login/');
            this.setLoginData(loginData);
            this.storeLoginDataRequests.next();
        } catch (e) {
            console.log('Could not refresh login data', e);
        }
        this.markRefresh = false;
    }

    /**
     * Load the login data from the storage. If it there, set it.
     */
    private async loadLoginData(): Promise<void> {
        const loginData = await this.storageService.get<any>(LOGIN_DATA_STORAGE_KEY);
        if (isLoginData(loginData)) {
            this.setLoginData(loginData);
        }
    }

    /**
     * Triggers all subjects with the given data.
     *
     * @param loginData The data
     */
    private setLoginData(loginData: LoginData): void {
        this._privacyPolicy.next(loginData.privacy_policy);
        this._legalNotice.next(loginData.legal_notice);
        this._theme.next(loginData.theme);
        this._logoWebHeader.next(loginData.logo_web_header);
        this._loginInfoText.next(loginData.login_info_text);
        this._samlSettings.next(loginData.saml_settings);
    }

    /**
     * Saves the login data to the storeage. Do not call this method and
     * use `storeLoginDataRequests` instead. The data to store will be
     * taken form all subjects.
     */
    private storeLoginData(): void {
        if (this.OSStatus.isInHistoryMode) {
            return;
        }
        const loginData = {
            privacy_policy: this._privacyPolicy.getValue(),
            legal_notice: this._legalNotice.getValue(),
            theme: this._theme.getValue(),
            logo_web_header: this._logoWebHeader.getValue(),
            samlSettings: this._samlSettings.getValue()
        };
        this.storageService.set(LOGIN_DATA_STORAGE_KEY, loginData);
    }
}
