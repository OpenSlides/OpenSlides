import { BrowserModule, Title } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms'; // <-- NgModel lives here
import { HttpClientModule, HttpClientXsrfModule } from '@angular/common/http';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons';

import { AppComponent } from './app.component';
import { LoginComponent } from './users/login.component';
import { UsersComponent } from './users/users.component';
import { AppRoutingModule } from './app-routing.module';
import { ProjectorComponent } from './projector/projector.component';
import { ProjectorContainerComponent } from './projector/projector-container.component';
import { MotionsComponent } from './motions/motions.component';
import { AgendaComponent } from './agenda/agenda.component';
import { SiteComponent } from './site/site.component';
import { StartComponent } from './site/start.component';
import { AlertComponent } from './site/alert.component';
import { AlertService } from './site/alert.service';

//add font-awesome icons to library.
//will blow up the code.
library.add(fas);

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    UsersComponent,
    ProjectorComponent,
    ProjectorContainerComponent,
    MotionsComponent,
    AgendaComponent,
    SiteComponent,
    StartComponent,
    AlertComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    HttpClientXsrfModule.withOptions({
      cookieName: 'OpenSlidesCsrfToken',
      headerName: 'X-CSRFToken',
    }),
    FormsModule,
    FontAwesomeModule,
    AppRoutingModule
  ],
  providers: [
    Title,
    AlertService,
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }
