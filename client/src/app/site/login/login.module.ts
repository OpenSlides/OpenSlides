import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { LoginComponent } from './components/login-wrapper/login.component';
import { SharedModule } from '../../shared/shared.module';
import { LoginMaskComponent } from './components/login-mask/login-mask.component';
import { LoginLegalNoticeComponent } from './components/login-legal-notice/login-legal-notice.component';
import { LoginPrivacyPolicyComponent } from './components/login-privacy-policy/login-privacy-policy.component';

@NgModule({
    imports: [CommonModule, RouterModule, SharedModule],
    declarations: [LoginComponent, LoginMaskComponent, LoginLegalNoticeComponent, LoginPrivacyPolicyComponent]
})
export class LoginModule {}
