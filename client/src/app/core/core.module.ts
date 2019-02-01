import { NgModule, Optional, SkipSelf, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';

// Shared Components
import { PromptDialogComponent } from '../shared/components/prompt-dialog/prompt-dialog.component';
import { ChoiceDialogComponent } from '../shared/components/choice-dialog/choice-dialog.component';
import { ProjectionDialogComponent } from 'app/shared/components/projection-dialog/projection-dialog.component';
import { OperatorService } from './core-services/operator.service';
import { OnAfterAppsLoaded } from './onAfterAppsLoaded';

export const ServicesToLoadOnAppsLoaded: Type<OnAfterAppsLoaded>[] = [OperatorService];

/**
 * Global Core Module.
 */
@NgModule({
    imports: [CommonModule],
    providers: [Title],
    entryComponents: [PromptDialogComponent, ChoiceDialogComponent, ProjectionDialogComponent]
})
export class CoreModule {
    /** make sure CoreModule is imported only by one NgModule, the AppModule */
    public constructor(
        @Optional()
        @SkipSelf()
        parentModule: CoreModule
    ) {
        if (parentModule) {
            throw new Error('CoreModule is already loaded. Import only in AppModule');
        }
    }
}
