import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { ConfigFieldComponent } from './components/config-field/config-field.component';
import { ConfigListComponent } from './components/config-list/config-list.component';
import { ConfigOverviewComponent } from './components/config-overview/config-overview.component';
import { ConfigRoutingModule } from './config-routing.module';
import { CustomTranslationComponent } from './components/custom-translation/custom-translation.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
    imports: [CommonModule, ConfigRoutingModule, SharedModule],
    declarations: [ConfigOverviewComponent, ConfigListComponent, ConfigFieldComponent, CustomTranslationComponent]
})
export class ConfigModule {}
