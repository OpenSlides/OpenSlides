import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProjectorListComponent } from './components/projector-list/projector-list.component';
import { ProjectorDetailComponent } from './components/projector-detail/projector-detail.component';

const routes: Routes = [
    {
        path: '',
        component: ProjectorListComponent,
        pathMatch: 'full'
    },
    {
        path: 'detail/:id',
        component: ProjectorDetailComponent,
        data: { basePerm: 'core.can_see_projector' }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ProjectorRoutingModule {}
