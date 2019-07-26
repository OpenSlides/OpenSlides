import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { StatuteImportListComponent } from './components/statute-import-list/statute-import-list.component';
import { StatuteParagraphListComponent } from './components/statute-paragraph-list/statute-paragraph-list.component';
import { StatuteParagraphRoutingModule } from './statute-paragraph-routing.module';

@NgModule({
    declarations: [StatuteParagraphListComponent, StatuteImportListComponent],
    imports: [CommonModule, StatuteParagraphRoutingModule, SharedModule]
})
export class StatuteParagraphModule {}
