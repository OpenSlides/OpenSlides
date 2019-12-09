import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ErrorLogComponent } from './components/error-log/error-log.component';
import { ErrorComponent } from './components/error/error.component';
import { LegalNoticeComponent } from './components/legal-notice/legal-notice.component';
import { PrivacyPolicyComponent } from './components/privacy-policy/privacy-policy.component';
import { StartComponent } from './components/start/start.component';

const routes: Routes = [
    {
        path: '',
        component: StartComponent,
        pathMatch: 'full',
        data: { basePerm: 'core.can_see_frontpage' }
    },
    {
        path: 'legalnotice',
        component: LegalNoticeComponent
    },
    {
        path: 'privacypolicy',
        component: PrivacyPolicyComponent
    },
    {
        path: 'error',
        component: ErrorComponent
    },
    {
        path: 'errorlog',
        component: ErrorLogComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CommonRoutingModule {}
