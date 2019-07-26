import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { TagListComponent } from './components/tag-list/tag-list.component';
import { TagRoutingModule } from './tag-routing.module';

@NgModule({
    imports: [CommonModule, TagRoutingModule, SharedModule],
    declarations: [TagListComponent]
})
export class TagModule {}
