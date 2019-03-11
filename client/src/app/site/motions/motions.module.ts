import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MotionsRoutingModule } from './motions-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { perf } from 'perf';

@NgModule({
    imports: [CommonModule, MotionsRoutingModule, SharedModule]
})
export class MotionsModule {
    public constructor() {
        perf("Motion module constructor", "Components");
    }
}
