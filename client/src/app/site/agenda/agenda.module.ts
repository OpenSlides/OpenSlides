import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AgendaRoutingModule } from './agenda-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { AgendaListComponent } from './agenda-list/agenda-list.component';

@NgModule({
    imports: [CommonModule, AgendaRoutingModule, SharedModule],
    declarations: [AgendaListComponent]
})
export class AgendaModule {}
