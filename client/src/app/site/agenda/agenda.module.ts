import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { AgendaListComponent } from './components/agenda-list/agenda-list.component';
import { AgendaRoutingModule } from './agenda-routing.module';
import { AgendaSortComponent } from './components/agenda-sort/agenda-sort.component';
import { TopicImportListComponent } from 'app/site/topics/components/topic-import-list/topic-import-list.component';
import { ItemInfoDialogComponent } from './components/item-info-dialog/item-info-dialog.component';
import { ListOfSpeakersComponent } from './components/list-of-speakers/list-of-speakers.component';
import { SharedModule } from '../../shared/shared.module';

/**
 * AppModule for the agenda and it's children.
 */
@NgModule({
    imports: [CommonModule, AgendaRoutingModule, SharedModule],
    declarations: [
        AgendaListComponent,
        ItemInfoDialogComponent,
        TopicImportListComponent,
        AgendaSortComponent,
        ListOfSpeakersComponent
    ]
})
export class AgendaModule {}
