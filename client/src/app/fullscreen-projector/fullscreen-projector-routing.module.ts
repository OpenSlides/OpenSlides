import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { FullscreenProjectorComponent } from './fullscreen-projector/fullscreen-projector.component';

const routes: Routes = [
    {
        path: '',
        component: FullscreenProjectorComponent,
        pathMatch: 'full'
    },
    {
        path: ':id',
        component: FullscreenProjectorComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class FullscreenProjectorRoutingModule {}
