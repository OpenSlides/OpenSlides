import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { SettingsRoutingModule } from './settings-routing.module';
import { SettingsListComponent } from './settings-list/settings-list.component';

@NgModule({
    imports: [CommonModule, SettingsRoutingModule, SharedModule],
    declarations: [SettingsListComponent]
})
export class SettingsModule {}
