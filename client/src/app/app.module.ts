import { BrowserModule, Title } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms'; // <-- NgModel lives here
import { HttpClientModule, HttpClientXsrfModule } from '@angular/common/http';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons';

import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { UsersComponent } from './users/users.component';
import { AppRoutingModule } from './/app-routing.module';
import { ProjectorComponent } from './projector/projector.component';
import { MotionsComponent } from './motions/motions.component';
import { AgendaComponent } from './agenda/agenda.component';
import { SiteComponent } from './site/site.component';
import { StartComponent } from './start/start.component';
import { AlertComponent } from './_directives/alert/alert.component';
import { AlertService } from './_services/alert.service';

//add font-awesome icons to library.
//will blow up the code.
library.add(fas);

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    UsersComponent,
    ProjectorComponent,
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
