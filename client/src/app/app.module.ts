// angular modules
import { BrowserModule, Title } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClientXsrfModule } from '@angular/common/http';

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
import { ToastComponent } from './core/directives/toast/toast.component';
import { ToastService } from './core/services/toast.service';
import { WebsocketService } from './core/services/websocket.service';
import { ProjectorContainerComponent } from './projector-container/projector-container.component';
import { AlertComponent } from './core/directives/alert/alert.component';

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
        ToastComponent,
        ProjectorContainerComponent,
        AlertComponent
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
        AppRoutingModule
    ],
    providers: [Title, ToastService, WebsocketService],
    bootstrap: [AppComponent]
})
export class AppModule {}
