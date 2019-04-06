import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CommonRoutingModule } from './common-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { PrivacyPolicyComponent } from './components/privacy-policy/privacy-policy.component';
import { StartComponent } from './components/start/start.component';
import { LegalNoticeComponent } from './components/legal-notice/legal-notice.component';
import { SearchComponent } from './components/search/search.component';
import { CountUsersComponent } from './components/count-users/count-users.component';
import { ErrorComponent } from './components/error/error.component';

@NgModule({
    imports: [CommonModule, CommonRoutingModule, SharedModule],
    declarations: [
        PrivacyPolicyComponent,
        StartComponent,
        LegalNoticeComponent,
        SearchComponent,
        CountUsersComponent,
        ErrorComponent
    ]
})
export class OsCommonModule {}
