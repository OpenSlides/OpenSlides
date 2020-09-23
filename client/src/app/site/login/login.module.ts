import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { LoginLegalNoticeComponent } from './components/login-legal-notice/login-legal-notice.component';
import { LoginMaskComponent } from './components/login-mask/login-mask.component';
import { LoginPrivacyPolicyComponent } from './components/login-privacy-policy/login-privacy-policy.component';
import { LoginWrapperComponent } from './components/login-wrapper/login-wrapper.component';
import { ResetPasswordConfirmComponent } from './components/reset-password-confirm/reset-password-confirm.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { SharedModule } from '../../shared/shared.module';
import { UnsupportedBrowserComponent } from './components/unsupported-browser/unsupported-browser.component';

@NgModule({
    imports: [CommonModule, RouterModule, SharedModule],
    declarations: [
        LoginWrapperComponent,
        ResetPasswordComponent,
        ResetPasswordConfirmComponent,
        LoginMaskComponent,
        LoginLegalNoticeComponent,
        LoginPrivacyPolicyComponent,
        UnsupportedBrowserComponent
    ]
})
export class LoginModule {}
