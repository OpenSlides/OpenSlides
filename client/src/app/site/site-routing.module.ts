import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SiteComponent } from './site.component';

import { StartComponent } from './start/start.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { LegalNoticeComponent } from './legal-notice/legal-notice.component';
import { AuthGuard } from '../core/services/auth-guard.service';

/**
 * Routung to all OpenSlides apps
 *
 * TODO: Plugins will have to append to the Routes-Array
 */
const routes: Routes = [
    {
        path: '',
        component: SiteComponent,
        children: [
            {
                path: '',
                component: StartComponent
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
                path: 'agenda',
                loadChildren: './agenda/agenda.module#AgendaModule'
            },
            {
                path: 'assignments',
                loadChildren: './assignments/assignments.module#AssignmentsModule'
            },
            {
                path: 'mediafiles',
                loadChildren: './mediafiles/mediafiles.module#MediafilesModule'
            },
            {
                path: 'motions',
                loadChildren: './motions/motions.module#MotionsModule'
            },
            {
                path: 'settings',
                loadChildren: './settings/settings.module#SettingsModule'
            },
            {
                path: 'users',
                loadChildren: './users/users.module#UsersModule'
            }
        ],
        canActivateChild: [AuthGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SiteRoutingModule {}
