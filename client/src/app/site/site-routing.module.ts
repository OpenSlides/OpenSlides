import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '../core/core-services/auth-guard.service';
import { SiteComponent } from './site.component';

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
                loadChildren: () => import('./common/os-common.module').then(m => m.OsCommonModule)
            },
            {
                path: 'agenda',
                loadChildren: () => import('./agenda/agenda.module').then(m => m.AgendaModule),
                data: { basePerm: 'agenda.can_see' }
            },
            {
                path: 'topics',
                loadChildren: () => import('./topics/topics.module').then(m => m.TopicsModule),
                data: { basePerm: 'agenda.can_see' }
            },
            {
                path: 'assignments',
                loadChildren: () => import('./assignments/assignments.module').then(m => m.AssignmentsModule),
                data: { basePerm: 'assignments.can_see' }
            },
            {
                path: 'mediafiles',
                loadChildren: () => import('./mediafiles/mediafiles.module').then(m => m.MediafilesModule),
                data: { basePerm: 'mediafiles.can_see' }
            },
            {
                path: 'motions',
                loadChildren: () => import('./motions/motions.module').then(m => m.MotionsModule),
                data: { basePerm: 'motions.can_see' }
            },
            {
                path: 'settings',
                loadChildren: () => import('./config/config.module').then(m => m.ConfigModule),
                data: { basePerm: 'core.can_manage_config' }
            },
            {
                path: 'users',
                loadChildren: () => import('./users/users.module').then(m => m.UsersModule)
                // No baseperm, because change own password is ok, even if the
                // user does not have users.can_see_name
            },
            {
                path: 'tags',
                loadChildren: () => import('./tags/tag.module').then(m => m.TagModule),
                data: { basePerm: 'core.can_manage_tags' }
            },
            {
                path: 'history',
                loadChildren: () => import('./history/history.module').then(m => m.HistoryModule),
                data: { basePerm: 'core.can_see_history' }
            },
            {
                path: 'projectors',
                loadChildren: () => import('./projector/projector.module').then(m => m.ProjectorModule),
                data: { basePerm: 'core.can_see_projector' }
            },
            {
                path: 'polls',
                loadChildren: () => import('./polls/polls.module').then(m => m.PollsModule),
                data: { basePerm: ['motions.can_see', 'assignments.can_see'] } // one of them is sufficient
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
