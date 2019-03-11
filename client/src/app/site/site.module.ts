import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from 'app/shared/shared.module';

import { SiteComponent } from './site.component';
import { SiteRoutingModule } from './site-routing.module';
import { perf } from 'perf';

@NgModule({
    imports: [CommonModule, SharedModule, SiteRoutingModule],
    declarations: [SiteComponent]
})
export class SiteModule {
    public constructor() {
        perf("Site module constructor", "Components");
    }
}
