import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CallListRoutingModule } from './call-list-routing.module';
import { CallListComponent } from './call-list.component';
import { SharedModule } from 'app/shared/shared.module';

@NgModule({
    declarations: [CallListComponent],
    imports: [CommonModule, CallListRoutingModule, SharedModule]
})
export class CallListModule {}
