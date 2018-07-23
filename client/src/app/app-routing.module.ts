import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './site/login/login.component';
import { AuthGuard } from './core/services/auth-guard.service';

/**
 * Global app routing
 */
const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'projector', loadChildren: './projector-container/projector-container.module#ProjectorContainerModule' },
    { path: '', loadChildren: './site/site.module#SiteModule', canActivate: [AuthGuard] },
    { path: '**', redirectTo: '' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {}
