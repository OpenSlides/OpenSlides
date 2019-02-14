import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProjectorListComponent } from './components/projector-list/projector-list.component';
import { ProjectorDetailComponent } from './components/projector-detail/projector-detail.component';
import { CountdownListComponent } from './components/countdown-list/countdown-list.component';
import { ProjectorMessageListComponent } from './components/projector-message-list/projector-message-list.component';

const routes: Routes = [
    {
        path: '',
        component: ProjectorListComponent
    },
    {
        path: 'detail/:id',
        component: ProjectorDetailComponent
    },
    {
        path: 'countdowns',
        component: CountdownListComponent
    },
    {
        path: 'messages',
        component: ProjectorMessageListComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ProjectorRoutingModule {}
