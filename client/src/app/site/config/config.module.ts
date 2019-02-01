import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { ConfigRoutingModule } from './config-routing.module';
import { ConfigListComponent } from './components/config-list/config-list.component';
import { ConfigFieldComponent } from './components/config-field/config-field.component';
import { CustomTranslationComponent } from './components/custom-translation/custom-translation.component';

@NgModule({
    imports: [CommonModule, ConfigRoutingModule, SharedModule],
    declarations: [ConfigListComponent, ConfigFieldComponent, CustomTranslationComponent],
    entryComponents: [CustomTranslationComponent]
})
export class ConfigModule {}
