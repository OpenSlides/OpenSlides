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
                loadChildren: './config/config.module#ConfigModule'
            },
            {
                path: 'users',
                loadChildren: './users/users.module#UsersModule'
            },
            {
                path: 'tags',
                loadChildren: './tags/tag.module#TagModule'
            },
            {
                path: 'history',
                loadChildren: './history/history.module#HistoryModule'
            },
            {
                path: 'projectors',
                loadChildren: './projector/projector.module#ProjectorModule'
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
