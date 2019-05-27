import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AgendaImportListComponent } from './components/agenda-import-list/agenda-import-list.component';
import { AgendaListComponent } from './components/agenda-list/agenda-list.component';
import { AgendaSortComponent } from './components/agenda-sort/agenda-sort.component';
import { WatchForChangesGuard } from 'app/shared/utils/watch-for-changes.guard';
import { ListOfSpeakersComponent } from './components/list-of-speakers/list-of-speakers.component';

const routes: Routes = [
    { path: '', component: AgendaListComponent, pathMatch: 'full' },
    { path: 'import', component: AgendaImportListComponent, data: { basePerm: 'agenda.can_manage' } },
    {
        path: 'sort-agenda',
        component: AgendaSortComponent,
        canDeactivate: [WatchForChangesGuard],
        data: { basePerm: 'agenda.can_manage' }
    },
    { path: 'speakers', component: ListOfSpeakersComponent, data: { basePerm: 'agenda.can_see_list_of_speakers' } },
    { path: 'speakers/:id', component: ListOfSpeakersComponent, data: { basePerm: 'agenda.can_see_list_of_speakers' } }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AgendaRoutingModule {}
