import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CommonRoutingModule } from './common-routing.module';
import { CountUsersComponent } from './components/count-users/count-users.component';
import { ErrorComponent } from './components/error/error.component';
import { LegalNoticeComponent } from './components/legal-notice/legal-notice.component';
import { PrivacyPolicyComponent } from './components/privacy-policy/privacy-policy.component';
import { SharedModule } from '../../shared/shared.module';
import { StartComponent } from './components/start/start.component';
import { UserStatisticsComponent } from './components/user-statistics/user-statistics.component';

@NgModule({
    imports: [CommonModule, CommonRoutingModule, SharedModule],
    declarations: [
        PrivacyPolicyComponent,
        StartComponent,
        LegalNoticeComponent,
        CountUsersComponent,
        ErrorComponent,
        UserStatisticsComponent
    ]
})
export class OsCommonModule {}
