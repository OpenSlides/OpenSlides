import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SiteComponent } from './site.component';

import { StartComponent } from './start/start.component';
// import { LoginComponent } from './login/login.component';

/**
 * Routung to all OpenSlides apps
 *
 * TODO: Plugins will have to append to the Routes-Array
 */
const routes: Routes = [
    // { path: 'login', component: LoginComponent },
    {
        path: '',
        component: SiteComponent,
        children: [
            { path: '', component: StartComponent },
            { path: 'agenda', loadChildren: './agenda/agenda.module#AgendaModule' },
            {
                path: 'assignments',
                loadChildren: './assignments/assignments.module#AssignmentsModule'
            },
            {
                path: 'mediafiles',
                loadChildren: './mediafiles/mediafiles.module#MediafilesModule'
            },
            { path: 'motions', loadChildren: './motions/motions.module#MotionsModule' },
            {
                path: 'settings',
                loadChildren: './settings/settings.module#SettingsModule'
            },
            { path: 'users', loadChildren: './users/users.module#UsersModule' }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SiteRoutingModule {}
