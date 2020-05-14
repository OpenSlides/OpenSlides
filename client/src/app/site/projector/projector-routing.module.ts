import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Permission } from 'app/core/core-services/operator.service';
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
        data: { basePerm: Permission.coreCanManageProjector }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ProjectorRoutingModule {}
