import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SiteRoutingModule } from './site-routing.module';
import { SharedModule } from 'app/shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';

import { SiteComponent } from './site.component';
import { StartComponent } from './start/start.component';

@NgModule({
    imports: [CommonModule, SharedModule, SiteRoutingModule, TranslateModule.forChild()],
    declarations: [SiteComponent, StartComponent]
})
export class SiteModule {}
