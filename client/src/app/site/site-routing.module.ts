import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SiteComponent } from './site.component';
import { AuthGuard } from '../core/core-services/auth-guard.service';

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
                loadChildren: './common/os-common.module#OsCommonModule'
            },
            {
                path: 'agenda',
                loadChildren: './agenda/agenda.module#AgendaModule',
                data: { basePerm: 'agenda.can_see' }
            },
            {
                path: 'assignments',
                loadChildren: './assignments/assignments.module#AssignmentsModule',
                data: { basePerm: 'assignment.can_see' }
            },
            {
                path: 'mediafiles',
                loadChildren: './mediafiles/mediafiles.module#MediafilesModule',
                data: { basePerm: 'mediafiles.can_see' }
            },
            {
                path: 'motions',
                loadChildren: './motions/motions.module#MotionsModule',
                data: { basePerm: 'motions.can_see' }
            },
            {
                path: 'settings',
                loadChildren: './config/config.module#ConfigModule',
                data: { basePerm: 'core.can_manage_config' }
            },
            {
                path: 'users',
                loadChildren: './users/users.module#UsersModule',
                data: { basePerm: 'users.can_see_name' }
            },
            {
                path: 'tags',
                loadChildren: './tags/tag.module#TagModule',
                data: { basePerm: 'core.can_manage_tags' }
            },
            {
                path: 'history',
                loadChildren: './history/history.module#HistoryModule',
                data: { basePerm: 'core.can_see_history' }
            },
            {
                path: 'projectors',
                loadChildren: './projector/projector.module#ProjectorModule',
                data: { basePerm: 'core.can_see_projector' }
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
