import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SiteRoutingModule } from './site-routing.module';
import { SharedModule } from 'app/shared/shared.module';

import { SiteComponent } from './site.component';
import { StartComponent } from './start/start.component';
import { LegalNoticeComponent } from './legal-notice/legal-notice.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';

@NgModule({
    imports: [CommonModule, SharedModule, SiteRoutingModule],
    declarations: [SiteComponent, StartComponent, LegalNoticeComponent, PrivacyPolicyComponent]
})
export class SiteModule {}
