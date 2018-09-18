import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { ConfigRoutingModule } from './config-routing.module';
import { ConfigListComponent } from './components/config-list/config-list.component';
import { ConfigFieldComponent } from './components/config-field/config-field.component';

@NgModule({
    imports: [CommonModule, ConfigRoutingModule, SharedModule],
    declarations: [ConfigListComponent, ConfigFieldComponent]
})
export class ConfigModule {}
