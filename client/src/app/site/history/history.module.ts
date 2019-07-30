import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { HistoryListComponent } from './components/history-list/history-list.component';
import { HistoryRoutingModule } from './history-routing.module';
import { SharedModule } from '../../shared/shared.module';

/**
 * App module for the history feature.
 * Declares the used components.
 */
@NgModule({
    imports: [CommonModule, HistoryRoutingModule, SharedModule],
    declarations: [HistoryListComponent]
})
export class HistoryModule {}
