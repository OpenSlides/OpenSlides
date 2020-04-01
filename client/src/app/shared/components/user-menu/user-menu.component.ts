import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';

import { AuthService } from 'app/core/core-services/auth.service';
import { OperatorService } from 'app/core/core-services/operator.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { LoginDataService } from 'app/core/ui-services/login-data.service';
import { OverlayService } from 'app/core/ui-services/overlay.service';
import { DEFAULT_AUTH_TYPE } from 'app/shared/models/users/user';
import { BaseViewComponent } from 'app/site/base/base-view';
import { ViewUser } from 'app/site/users/models/view-user';

@Component({
    selector: 'os-user-menu',
    templateUrl: './user-menu.component.html',
    styleUrls: ['./user-menu.component.scss']
})
export class UserMenuComponent extends BaseViewComponent implements OnInit {
    public isLoggedIn: boolean;

    public user: ViewUser;

    public username = '';

    public authType = DEFAULT_AUTH_TYPE;

    public samlChangePasswordUrl: string | null = null;

    public allowSelfSetPresent: boolean;

    private selfPresentConfStr = 'users_allow_self_set_present';

    @Output()
    private navEvent: EventEmitter<void> = new EventEmitter();

    public constructor(
        titleService: Title,
        protected translate: TranslateService,
        protected matSnackBar: MatSnackBar,
        private operator: OperatorService,
        private authService: AuthService,
        private overlayService: OverlayService, // private vp: ViewportService,
        private loginDataService: LoginDataService,
        private configService: ConfigService,
        private router: Router
    ) {
        super(titleService, translate, matSnackBar);
    }

    public ngOnInit(): void {
        this.operator.getViewUserObservable().subscribe(user => {
            if (user) {
                this.user = user;
            }
            if (!this.operator.isAnonymous) {
                this.username = user ? user.short_name : '';
                this.isLoggedIn = true;
            } else {
                this.username = this.translate.instant('Guest');
                this.isLoggedIn = false;
            }
        });

        this.operator.authType.subscribe(authType => (this.authType = authType));

        this.loginDataService.samlSettings.subscribe(
            samlSettings => (this.samlChangePasswordUrl = samlSettings ? samlSettings.changePasswordUrl : null)
        );

        this.configService
            .get<boolean>(this.selfPresentConfStr)
            .subscribe(allowed => (this.allowSelfSetPresent = allowed));
    }

    public isOnProfilePage(): boolean {
        const ownProfilePageUrl = `/users/${this.user.id}`;
        return ownProfilePageUrl === this.router.url;
    }

    public isOnChangePasswordPage(): boolean {
        const changePasswordPageUrl = '/users/password';
        return changePasswordPageUrl === this.router.url;
    }

    /**
     * Let the user change the language
     * @param lang the desired language (en, de, cs, ...)
     */
    public selectLang(selection: string): void {
        this.translate.use(selection).subscribe();
    }

    /**
     * Get the name of a Language by abbreviation.
     *
     * @param abbreviation The abbreviation of the languate or null, if the current
     * language should be used.
     */
    public getLangName(abbreviation?: string): string {
        if (!abbreviation) {
            abbreviation = this.translate.currentLang;
        }

        if (abbreviation === 'en') {
            return 'English';
        } else if (abbreviation === 'de') {
            return 'Deutsch';
        } else if (abbreviation === 'cs') {
            return 'Čeština';
        } else if (abbreviation === 'ru') {
            return 'русский';
        }
    }

    public toggleUserIsPresent(): void {
        this.operator.setPresence(!this.user.is_present).catch(this.raiseError);
    }

    public onClickNavEntry(): void {
        this.navEvent.next();
    }

    /**
     * Function to log out the current user
     */
    public logout(): void {
        if (this.operator.guestsEnabled) {
            this.overlayService.showSpinner(null, true);
        }
        this.authService.logout();
        this.overlayService.logout();
    }
}
