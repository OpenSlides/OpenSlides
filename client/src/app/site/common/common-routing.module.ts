import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

import { Permission } from 'app/core/core-services/operator.service';
import { ErrorComponent } from './components/error/error.component';
import { LegalNoticeComponent } from './components/legal-notice/legal-notice.component';
import { PrivacyPolicyComponent } from './components/privacy-policy/privacy-policy.component';
import { StartComponent } from './components/start/start.component';

const routes: Route[] = [
    {
        path: '',
        component: StartComponent,
        pathMatch: 'full',
        data: { basePerm: Permission.coreCanSeeFrontpage }
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
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CommonRoutingModule {}
