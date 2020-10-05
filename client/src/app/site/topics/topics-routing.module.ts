import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

import { Permission } from 'app/core/core-services/operator.service';
import { TopicDetailComponent } from './components/topic-detail/topic-detail.component';

const routes: Route[] = [
    { path: 'new', component: TopicDetailComponent, data: { basePerm: Permission.agendaCanManage } },
    { path: ':id', component: TopicDetailComponent, data: { basePerm: Permission.agendaCanSee } }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TopicsRoutingModule {}
