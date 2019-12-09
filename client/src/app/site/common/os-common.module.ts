import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CommonRoutingModule } from './common-routing.module';
import { CountUsersComponent } from './components/count-users/count-users.component';
import { ErrorLogComponent } from './components/error-log/error-log.component';
import { ErrorComponent } from './components/error/error.component';
import { LegalNoticeComponent } from './components/legal-notice/legal-notice.component';
import { PrivacyPolicyComponent } from './components/privacy-policy/privacy-policy.component';
import { SharedModule } from '../../shared/shared.module';
import { StartComponent } from './components/start/start.component';

@NgModule({
    imports: [CommonModule, CommonRoutingModule, SharedModule],
    declarations: [
        PrivacyPolicyComponent,
        StartComponent,
        LegalNoticeComponent,
        CountUsersComponent,
        ErrorComponent,
        ErrorLogComponent
    ]
})
export class OsCommonModule {}
