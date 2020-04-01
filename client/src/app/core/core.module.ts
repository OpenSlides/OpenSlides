import { CommonModule } from '@angular/common';
import { NgModule, Optional, SkipSelf, Type } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { OnAfterAppsLoaded } from './definitions/on-after-apps-loaded';
import { OperatorService } from './core-services/operator.service';

export const ServicesToLoadOnAppsLoaded: Type<OnAfterAppsLoaded>[] = [OperatorService];

/**
 * Global Core Module.
 */
@NgModule({
    imports: [CommonModule],
    providers: [Title]
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
