import { NgModule } from '@angular/core';
import { CommonModule as AngularCommonModule } from '@angular/common';

import { CommonRoutingModule } from './common-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { PrivacyPolicyComponent } from './components/privacy-policy/privacy-policy.component';
import { StartComponent } from './components/start/start.component';
import { LegalNoticeComponent } from './components/legal-notice/legal-notice.component';
import { SearchComponent } from './components/search/search.component';
import { CountdownRepositoryService } from './services/countdown-repository.service';
import { CountdownListComponent } from './components/countdown-list/countdown-list.component';
import { ProjectorMessageListComponent } from './components/projectormessage-list/projectormessage-list.component';

@NgModule({
    providers: [CountdownRepositoryService],
    imports: [AngularCommonModule, CommonRoutingModule, SharedModule],
    declarations: [
        PrivacyPolicyComponent,
        StartComponent,
        LegalNoticeComponent,
        SearchComponent,
        CountdownListComponent,
        ProjectorMessageListComponent
    ]
})
export class CommonModule {}
