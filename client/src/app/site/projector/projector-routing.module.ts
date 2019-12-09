import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ProjectorDetailComponent } from './components/projector-detail/projector-detail.component';
import { ProjectorListComponent } from './components/projector-list/projector-list.component';

const routes: Routes = [
    {
        path: '',
        component: ProjectorListComponent,
        pathMatch: 'full'
    },
    {
        path: 'detail/:id',
        component: ProjectorDetailComponent,
        data: { basePerm: 'core.can_can_manage_projector' }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ProjectorRoutingModule {}
