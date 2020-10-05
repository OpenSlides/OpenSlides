import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

import { AgendaListComponent } from './components/agenda-list/agenda-list.component';
import { AgendaSortComponent } from './components/agenda-sort/agenda-sort.component';
import { Permission } from 'app/core/core-services/operator.service';
import { WatchForChangesGuard } from 'app/shared/utils/watch-for-changes.guard';
import { TopicImportListComponent } from 'app/site/topics/components/topic-import-list/topic-import-list.component';
import { ListOfSpeakersComponent } from './components/list-of-speakers/list-of-speakers.component';

const routes: Route[] = [
    { path: '', component: AgendaListComponent, pathMatch: 'full' },
    { path: 'import', component: TopicImportListComponent, data: { basePerm: Permission.agendaCanManage } },
    {
        path: 'sort-agenda',
        component: AgendaSortComponent,
        canDeactivate: [WatchForChangesGuard],
        data: { basePerm: Permission.agendaCanManage }
    },
    { path: 'speakers', component: ListOfSpeakersComponent, data: { basePerm: Permission.agendaCanSeeListOfSpeakers } },
    {
        path: 'speakers/:id',
        component: ListOfSpeakersComponent,
        data: { basePerm: Permission.agendaCanSeeListOfSpeakers }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AgendaRoutingModule {}
