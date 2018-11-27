import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';

// Core Services, Directives
import { AuthGuard } from './services/auth-guard.service';
import { AuthService } from './services/auth.service';
import { AutoupdateService } from './services/autoupdate.service';
import { DataStoreService } from './services/data-store.service';
import { OperatorService } from './services/operator.service';
import { WebsocketService } from './services/websocket.service';
import { DataSendService } from './services/data-send.service';
import { ViewportService } from './services/viewport.service';
import { PromptDialogComponent } from '../shared/components/prompt-dialog/prompt-dialog.component';
import { HttpService } from './services/http.service';
import { ChoiceDialogComponent } from '../shared/components/choice-dialog/choice-dialog.component';

/** Global Core Module. Contains all global (singleton) services
 *
 */
@NgModule({
    imports: [CommonModule],
    providers: [
        Title,
        AuthGuard,
        AuthService,
        AutoupdateService,
        DataStoreService,
        DataSendService,
        HttpService,
        OperatorService,
        ViewportService,
        WebsocketService
    ],
    entryComponents: [PromptDialogComponent, ChoiceDialogComponent]
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
