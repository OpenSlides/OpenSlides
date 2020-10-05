import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

import { LoginLegalNoticeComponent } from './site/login/components/login-legal-notice/login-legal-notice.component';
import { LoginMaskComponent } from './site/login/components/login-mask/login-mask.component';
import { LoginPrivacyPolicyComponent } from './site/login/components/login-privacy-policy/login-privacy-policy.component';
import { LoginWrapperComponent } from './site/login/components/login-wrapper/login-wrapper.component';
import { ResetPasswordConfirmComponent } from './site/login/components/reset-password-confirm/reset-password-confirm.component';
import { ResetPasswordComponent } from './site/login/components/reset-password/reset-password.component';
import { UnsupportedBrowserComponent } from './site/login/components/unsupported-browser/unsupported-browser.component';

/**
 * Global app routing
 */
const routes: Route[] = [
    {
        path: 'login',
        component: LoginWrapperComponent,
        children: [
            { path: '', component: LoginMaskComponent, pathMatch: 'full' },
            { path: 'reset-password', component: ResetPasswordComponent },
            { path: 'reset-password-confirm', component: ResetPasswordConfirmComponent },
            { path: 'legalnotice', component: LoginLegalNoticeComponent },
            { path: 'privacypolicy', component: LoginPrivacyPolicyComponent },
            { path: 'unsupported-browser', component: UnsupportedBrowserComponent }
        ]
    },
    {
        path: 'projector',
        loadChildren: () =>
            import('./fullscreen-projector/fullscreen-projector.module').then(m => m.FullscreenProjectorModule),
        data: { noInterruption: true }
    },
    { path: '', loadChildren: () => import('./site/site.module').then(m => m.SiteModule) },
    { path: '**', redirectTo: '' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })],
    exports: [RouterModule]
})
export class AppRoutingModule {}
