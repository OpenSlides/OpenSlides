import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable } from 'rxjs';

import { OpenSlidesComponent } from 'app/openslides.component';
import { ConfigService } from './config.service';

/**
 * This service holds the privacy policy and the legal notice, so they are available
 * even if the user is not logged in.
 */
@Injectable({
    providedIn: 'root'
})
export class LoginDataService extends OpenSlidesComponent {
    /**
     * Holds the privacy policy
     */
    private _privacy_policy = new BehaviorSubject<string>('');

    /**
     * Returns an observable for the privacy policy
     */
    public get privacy_policy(): Observable<string> {
        return this._privacy_policy.asObservable();
    }

    /**
     * Holds the legal notice
     */
    private _legal_notice = new BehaviorSubject<string>('');

    /**
     * Returns an observable for the legal notice
     */
    public get legal_notice(): Observable<string> {
        return this._legal_notice.asObservable();
    }

    /**
     * Constructs this service. The config service is needed to update the privacy
     * policy and legal notice, when their config values change.
     * @param configService
     */
    public constructor(private configService: ConfigService) {
        super();

        this.configService.get('general_event_privacy_policy').subscribe(value => {
            this.setPrivacyPolicy(value);
        });
        this.configService.get('general_event_legal_notice').subscribe(value => {
            this.setLegalNotice(value);
        });
    }

    /**
     * Setter for the privacy policy
     * @param privacyPolicy The new privacy policy to set
     */
    public setPrivacyPolicy(privacyPolicy: string): void {
        this._privacy_policy.next(privacyPolicy);
    }

    /**
     * Setter for the legal notice
     * @param legalNotice The new legal notice to set
     */
    public setLegalNotice(legalNotice: string): void {
        this._legal_notice.next(legalNotice);
    }
}
