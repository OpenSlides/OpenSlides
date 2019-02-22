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
                loadChildren: './common/os-common.module#OsCommonModule',
                data: { preload: true }
            },
            {
                path: 'agenda',
                loadChildren: './agenda/agenda.module#AgendaModule',
                data: { preload: true }
            },
            {
                path: 'assignments',
                loadChildren: './assignments/assignments.module#AssignmentsModule',
                data: { preload: true }
            },
            {
                path: 'mediafiles',
                loadChildren: './mediafiles/mediafiles.module#MediafilesModule',
                data: { preload: true }
            },
            {
                path: 'motions',
                loadChildren: './motions/motions.module#MotionsModule',
                data: { preload: true }
            },
            {
                path: 'settings',
                loadChildren: './config/config.module#ConfigModule',
                data: { preload: true }
            },
            {
                path: 'users',
                loadChildren: './users/users.module#UsersModule',
                data: { preload: true }
            },
            {
                path: 'tags',
                loadChildren: './tags/tag.module#TagModule',
                data: { preload: true }
            },
            {
                path: 'history',
                loadChildren: './history/history.module#HistoryModule',
                data: { preload: true }
            },
            {
                path: 'projectors',
                loadChildren: './projector/projector.module#ProjectorModule',
                data: { preload: true }
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
