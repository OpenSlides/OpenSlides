import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TagRoutingModule } from './tag-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { TagListComponent } from './components/tag-list/tag-list.component';

@NgModule({
    imports: [CommonModule, TagRoutingModule, SharedModule],
    declarations: [TagListComponent]
})
export class TagModule {}
