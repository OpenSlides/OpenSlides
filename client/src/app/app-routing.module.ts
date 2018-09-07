import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './site/login/components/login-wrapper/login.component';
import { LoginMaskComponent } from './site/login/components/login-mask/login-mask.component';
import { LoginInfoComponent } from './site/login/components/login-info/login-info.component';

/**
 * Global app routing
 */
const routes: Routes = [
    {
        path: 'login',
        component: LoginComponent,
        children: [
            { path: '', component: LoginMaskComponent },
            { path: 'legalnotice', component: LoginInfoComponent },
            { path: 'privacypolicy', component: LoginInfoComponent }
        ]
    },

    { path: 'projector', loadChildren: './projector-container/projector-container.module#ProjectorContainerModule' },
    { path: '', loadChildren: './site/site.module#SiteModule' },
    { path: '**', redirectTo: '' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {}
