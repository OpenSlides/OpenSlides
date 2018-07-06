// angular modules
import { BrowserModule, Title } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient, HttpClientXsrfModule } from '@angular/common/http';

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
import { WebsocketService } from './core/services/websocket.service';
import { ProjectorContainerComponent } from './projector-container/projector-container.component';
import { AlertComponent } from './core/directives/alert/alert.component';

//translation module. TODO: Potetially a SharedModule and own files
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { PruningTranslationLoader } from './core/pruning-loader';
import { OsPermsDirective } from './core/directives/os-perms.directive';

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
        AlertComponent,
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
    providers: [Title, WebsocketService],
    bootstrap: [AppComponent]
})
export class AppModule {}
