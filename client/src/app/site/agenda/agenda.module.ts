import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AgendaImportListComponent } from './components/agenda-import-list/agenda-import-list.component';
import { AgendaListComponent } from './components/agenda-list/agenda-list.component';
import { ItemInfoDialogComponent } from './components/item-info-dialog/item-info-dialog.component';
import { AgendaRoutingModule } from './agenda-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { TopicDetailComponent } from './components/topic-detail/topic-detail.component';
import { AgendaSortComponent } from './components/agenda-sort/agenda-sort.component';

/**
 * AppModule for the agenda and it's children.
 */
@NgModule({
    imports: [CommonModule, AgendaRoutingModule, SharedModule],
    entryComponents: [ItemInfoDialogComponent],
    declarations: [
        AgendaListComponent,
        TopicDetailComponent,
        ItemInfoDialogComponent,
        AgendaImportListComponent,
        AgendaSortComponent
    ]
})
export class AgendaModule {}
