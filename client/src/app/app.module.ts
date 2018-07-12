// angular modules
import { BrowserModule, Title } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient, HttpClientXsrfModule, HTTP_INTERCEPTORS } from '@angular/common/http';

// MaterialUI modules
import {
    MatButtonModule,
    MatCheckboxModule,
    MatToolbarModule,
    MatCardModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatSnackBarModule
} from '@angular/material';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';

// FontAwesome modules
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';

// App components and services
import { AppComponent } from './app.component';
import { LoginComponent } from './site/login/login.component';
import { AppRoutingModule } from './app-routing.module';
import { ProjectorComponent } from './projector-container/projector/projector.component';
import { MotionsComponent } from './site/motions/motions.component';
import { AgendaComponent } from './site/agenda/agenda.component';
import { SiteComponent } from './site/site.component';
import { StartComponent } from './site/start/start.component';
import { AddHeaderInterceptor } from './core/http-interceptor';
import { ProjectorContainerComponent } from './projector-container/projector-container.component';

// Root Services
import { AuthGuard } from './core/services/auth-guard.service';
import { AuthService } from './core/services/auth.service';
import { AutoupdateService } from './core/services/autoupdate.service';
import { DataStoreService } from './core/services/dataStore.service';
import { OperatorService } from './core/services/operator.service';
import { WebsocketService } from './core/services/websocket.service';

// translation module.
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { PruningTranslationLoader } from './core/pruning-loader';
import { OsPermsDirective } from './core/directives/os-perms.directive';

/**
 * For the translation module. Loads a Custom 'translation loader' and provides it as loader.
 * @param http Just the HttpClient to load stuff
 */
export function HttpLoaderFactory(http: HttpClient) {
    return new PruningTranslationLoader(http);
}

//add font-awesome icons to library.
//will blow up the code.
library.add(fas);

@NgModule({
    declarations: [
        AppComponent,
        LoginComponent,
        ProjectorComponent,
        MotionsComponent,
        AgendaComponent,
        SiteComponent,
        StartComponent,
        ProjectorContainerComponent,
        OsPermsDirective
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
        HttpClientXsrfModule.withOptions({
            cookieName: 'OpenSlidesCsrfToken',
            headerName: 'X-CSRFToken'
        }),
        FormsModule,
        BrowserAnimationsModule,
        MatButtonModule,
        MatCheckboxModule,
        MatToolbarModule,
        MatCardModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSidenavModule,
        MatListModule,
        MatExpansionModule,
        MatMenuModule,
        MatSnackBarModule,
        FontAwesomeModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient]
            }
        }),
        AppRoutingModule
    ],
    providers: [
        Title,
        AuthGuard,
        AuthService,
        AutoupdateService,
        DataStoreService,
        OperatorService,
        WebsocketService,
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AddHeaderInterceptor,
            multi: true
        }
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
