import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { LoginWrapperComponent } from './components/login-wrapper/login-wrapper.component';
import { SharedModule } from '../../shared/shared.module';
import { LoginMaskComponent } from './components/login-mask/login-mask.component';
import { LoginLegalNoticeComponent } from './components/login-legal-notice/login-legal-notice.component';
import { LoginPrivacyPolicyComponent } from './components/login-privacy-policy/login-privacy-policy.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { ResetPasswordConfirmComponent } from './components/reset-password-confirm/reset-password-confirm.component';

@NgModule({
    imports: [CommonModule, RouterModule, SharedModule],
    declarations: [
        LoginWrapperComponent,
        ResetPasswordComponent,
        ResetPasswordConfirmComponent,
        LoginMaskComponent,
        LoginLegalNoticeComponent,
        LoginPrivacyPolicyComponent
    ]
})
export class LoginModule {}
