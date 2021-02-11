import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

import { Permission } from 'app/core/core-services/operator.service';
import { AuthGuard } from '../core/core-services/auth-guard.service';
import { SiteComponent } from './site.component';

/**
 * Routung to all OpenSlides apps
 *
 * TODO: Plugins will have to append to the Routes-Array
 */
const routes: Route[] = [
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
                data: { basePerm: Permission.agendaCanSee }
            },
            {
                path: 'topics',
                loadChildren: () => import('./topics/topics.module').then(m => m.TopicsModule),
                data: { basePerm: Permission.agendaCanSee }
            },
            {
                path: 'assignments',
                loadChildren: () => import('./assignments/assignments.module').then(m => m.AssignmentsModule),
                data: { basePerm: Permission.assignmentsCanSee }
            },
            {
                path: 'mediafiles',
                loadChildren: () => import('./mediafiles/mediafiles.module').then(m => m.MediafilesModule),
                data: { basePerm: Permission.mediafilesCanSee }
            },
            {
                path: 'chat',
                loadChildren: () => import('./chat/chat.module').then(m => m.ChatModule)
            },
            {
                path: 'motions',
                loadChildren: () => import('./motions/motions.module').then(m => m.MotionsModule),
                data: { basePerm: Permission.motionsCanSee }
            },
            {
                path: 'settings',
                loadChildren: () => import('./config/config.module').then(m => m.ConfigModule),
                data: { basePerm: Permission.coreCanManageConfig }
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
                data: { basePerm: Permission.coreCanManageTags }
            },
            {
                path: 'history',
                loadChildren: () => import('./history/history.module').then(m => m.HistoryModule),
                data: { basePerm: Permission.coreCanSeeHistory }
            },
            {
                path: 'projectors',
                loadChildren: () => import('./projector/projector.module').then(m => m.ProjectorModule),
                data: { basePerm: Permission.coreCanSeeProjector }
            },
            {
                path: 'polls',
                loadChildren: () => import('./polls/polls.module').then(m => m.PollsModule),
                // one of them is sufficient
                data: { basePerm: [Permission.motionsCanSee, Permission.assignmentsCanSee] }
            },
            {
                path: 'autopilot',
                loadChildren: () => import('./cinema/cinema.module').then(m => m.CinemaModule),
                data: { basePerm: Permission.coreCanSeeAutopilot }
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
