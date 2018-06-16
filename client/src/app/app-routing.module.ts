import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ProjectorComponent } from "./projector/projector.component";
import { ProjectorContainerComponent } from "./projector/projector-container.component";
import { StartComponent } from "./site/start.component";
import { AgendaComponent } from "./agenda/agenda.component";
import { MotionsComponent } from "./motions/motions.component";
import { SiteComponent } from "./site/site.component";
import { LoginComponent } from './users/login.component';

import { RouterAuthGuard } from "./core/router-auth-guard.service";

const routes: Routes = [
    { path: 'projector/:id', component: ProjectorComponent },
    //{ path: 'projector', redirect: 'projector/1' }, // Test this
    { path: 'real-projector/:id', component: ProjectorContainerComponent },
    //{ path: 'real-projector', redirect: 'real-projector/1' }, // this too
    {
        path: '',
        component: SiteComponent,
        canActivate: [RouterAuthGuard],
        children: [
            { path: '', component: StartComponent },
            { path: 'login', component: LoginComponent },
            { path: 'agenda', component: AgendaComponent },
            { path: 'motions', component: MotionsComponent },
        ]
    },
    { path: '**', redirectTo: '' },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
