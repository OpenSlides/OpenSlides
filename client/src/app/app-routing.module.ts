import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { ProjectorComponent } from "./projector/projector.component";
import { StartComponent } from "./start/start.component";
import { AgendaComponent } from "./agenda/agenda.component";
import { MotionsComponent } from "./motions/motions.component";
import { SiteComponent } from "./site/site.component";

import { AuthGuard } from "./_services/auth-guard.service";

const routes: Routes = [
  { path: 'projector', component: ProjectorComponent },
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: SiteComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: StartComponent },
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