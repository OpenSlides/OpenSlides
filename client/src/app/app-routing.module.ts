import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './site/login/login.component';
import { LegalNoticeComponent } from './site/legal-notice/legal-notice.component';
import { PrivacyPolicyComponent } from './site/privacy-policy/privacy-policy.component';

/**
 * Global app routing
 */
const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'legalnotice', component: LegalNoticeComponent },
    { path: 'privacypolicy', component: PrivacyPolicyComponent },
    { path: 'projector', loadChildren: './projector-container/projector-container.module#ProjectorContainerModule' },
    { path: '', loadChildren: './site/site.module#SiteModule' },
    { path: '**', redirectTo: '' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {}
