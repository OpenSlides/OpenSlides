import { NgModule } from '@angular/core';
import { CommonModule as AngularCommonModule } from '@angular/common';

import { CommonRoutingModule } from './common-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { PrivacyPolicyComponent } from './components/privacy-policy/privacy-policy.component';
import { StartComponent } from './components/start/start.component';
import { LegalNoticeComponent } from './components/legal-notice/legal-notice.component';
import { SearchComponent } from './components/search/search.component';
import { CountUsersComponent } from './components/count-users/count-users.component';

@NgModule({
    imports: [AngularCommonModule, CommonRoutingModule, SharedModule],
    declarations: [PrivacyPolicyComponent, StartComponent, LegalNoticeComponent, SearchComponent, CountUsersComponent]
})
export class CommonModule {}
