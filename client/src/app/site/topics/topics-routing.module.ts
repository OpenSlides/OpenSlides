import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TopicDetailComponent } from './components/topic-detail/topic-detail.component';

const routes: Routes = [
    { path: 'new', component: TopicDetailComponent, data: { basePerm: 'agenda.can_manage' } },
    { path: ':id', component: TopicDetailComponent, data: { basePerm: 'agenda.can_see' } }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TopicsRoutingModule {}
