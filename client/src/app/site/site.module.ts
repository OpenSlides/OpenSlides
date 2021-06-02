import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { InteractionModule } from './interaction/interaction.module';
import { SiteRoutingModule } from './site-routing.module';
import { SiteComponent } from './site.component';

@NgModule({
    imports: [CommonModule, SharedModule, SiteRoutingModule, InteractionModule],
    declarations: [SiteComponent]
})
export class SiteModule {}
