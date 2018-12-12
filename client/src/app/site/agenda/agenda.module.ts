import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AgendaRoutingModule } from './agenda-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { AgendaListComponent } from './components/agenda-list/agenda-list.component';
import { TopicDetailComponent } from './components/topic-detail/topic-detail.component';
import { ItemInfoDialogComponent } from './components/item-info-dialog/item-info-dialog.component';

/**
 * AppModule for the agenda and it's children.
 */
@NgModule({
    imports: [CommonModule, AgendaRoutingModule, SharedModule],
    entryComponents: [ ItemInfoDialogComponent ],
    declarations: [AgendaListComponent, TopicDetailComponent, ItemInfoDialogComponent]
})
export class AgendaModule {}
