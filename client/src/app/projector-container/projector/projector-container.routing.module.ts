import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProjectorContainerComponent } from '../projector-container.component';
import { ProjectorComponent } from './projector.component';

const routes: Routes = [
    { path: '', component: ProjectorContainerComponent },
    { path: 'real', component: ProjectorComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ProjectorContainerRoutingModule {}
