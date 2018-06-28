import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './site/login/login.component';
import { ProjectorComponent } from './projector-container/projector/projector.component';
import { ProjectorContainerComponent } from './projector-container/projector-container.component';
import { SiteComponent } from './site/site.component';
import { StartComponent } from './site/start/start.component';
import { AgendaComponent } from './site/agenda/agenda.component';
import { MotionsComponent } from './site/motions/motions.component';

import { AuthGuard } from './core/services/auth-guard.service';

const routes: Routes = [
    { path: 'projector/:id', component: ProjectorComponent },
    { path: 'real-projector/:id', component: ProjectorContainerComponent },
    { path: 'login', component: LoginComponent },
    {
        path: '',
        component: SiteComponent,
        canActivate: [AuthGuard],
        children: [
            { path: '', component: StartComponent },
            { path: 'agenda', component: AgendaComponent },
            { path: 'motions', component: MotionsComponent }
        ]
    },
    { path: '**', redirectTo: '' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {}
