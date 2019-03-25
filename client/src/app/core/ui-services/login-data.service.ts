import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable } from 'rxjs';

import { ConfigService } from './config.service';
import { StorageService } from '../core-services/storage.service';
import { OpenSlidesStatusService } from '../core-services/openslides-status.service';

/**
 * The login data send by the server.
 */
export interface LoginData {
    privacy_policy: string;
    legal_notice: string;
    theme: string;
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
     * Holds the privacy policy
     */
    private readonly _privacy_policy = new BehaviorSubject<string>('');

    /**
     * Returns an observable for the privacy policy
     */
    public get privacy_policy(): Observable<string> {
        return this._privacy_policy.asObservable();
    }

    /**
     * Holds the legal notice
     */
    private readonly _legal_notice = new BehaviorSubject<string>('');

    /**
     * Returns an observable for the legal notice
     */
    public get legal_notice(): Observable<string> {
        return this._legal_notice.asObservable();
    }

    /**
     * Holds the theme
     */
    private readonly _theme = new BehaviorSubject<string>('');

    /**
     * Returns an observable for the theme
     */
    public get theme(): Observable<string> {
        return this._theme.asObservable();
    }

    /**
     * Constructs this service. The config service is needed to update the privacy
     * policy and legal notice, when their config values change.
     * @param configService
     */
    public constructor(
        private configService: ConfigService,
        private storageService: StorageService,
        private OSStatus: OpenSlidesStatusService
    ) {
        this.configService.get<string>('general_event_privacy_policy').subscribe(value => {
            this._privacy_policy.next(value);
            this.storeLoginData();
        });
        this.configService.get<string>('general_event_legal_notice').subscribe(value => {
            this._legal_notice.next(value);
            this.storeLoginData();
        });
        configService.get<string>('openslides_theme').subscribe(value => {
            this._theme.next(value);
            this.storeLoginData();
        });

        this.loadLoginData();
    }

    /**
     * Load the login data from the storage. If it there, set it.
     */
    private async loadLoginData(): Promise<void> {
        const loginData = await this.storageService.get<LoginData | null>(LOGIN_DATA_STORAGE_KEY);
        if (loginData) {
            this.setLoginData(loginData);
        }
    }

    /**
     * Setter for the login data
     *
     * @param loginData the login data
     */
    public setLoginData(loginData: LoginData): void {
        this._privacy_policy.next(loginData.privacy_policy);
        this._legal_notice.next(loginData.legal_notice);
        this._theme.next(loginData.theme);
        this.storeLoginData(loginData);
    }

    /**
     * Saves the login data in the storage.
     *
     * @param loginData If given, this data is used. If it's null, the current values
     * from the behaviour subject are taken.
     */
    private storeLoginData(loginData?: LoginData): void {
        if (!loginData) {
            loginData = {
                privacy_policy: this._privacy_policy.getValue(),
                legal_notice: this._legal_notice.getValue(),
                theme: this._theme.getValue()
            };
        }
        if (!this.OSStatus.isInHistoryMode) {
            this.storageService.set(LOGIN_DATA_STORAGE_KEY, loginData);
        }
    }
}
