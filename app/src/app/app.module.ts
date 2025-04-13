// library
import { BrowserModule } from "@angular/platform-browser";
import { HttpClientModule } from "@angular/common/http";
import { FormsModule } from "@angular/forms";
import { NgModule } from "@angular/core";
import { NouisliderModule } from "ng2-nouislider";
import { NgMultiSelectDropDownModule } from "ng-multiselect-dropdown";
import { SocketIoModule, SocketIoConfig } from "ngx-socket-io";
import { AngularSplitModule } from "angular-split";
import { NgSelectModule } from "@ng-select/ng-select";
import { TooltipModule } from "ng2-tooltip-directive";
import { OverlayscrollbarsModule } from "overlayscrollbars-ngx";
import { ReactiveFormsModule } from '@angular/forms';
// local
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { Message } from "./models/message";
import { SessionPage, DeploymentConfig } from "./models/config";
import { HttpErrorHandler } from "./services/http-error-handler.service";
import { MessageService } from "./services/message.service";
import { ChatService } from "./services/socket.service";
import { UtilsService } from "./services/utils.service";
import { MainActivityComponent } from "./main-activity/component";
import { PreSurveyComponent } from './presurvey/presurvey.component';
import { PostPageComponent } from './post-page/post-page.component';
import { ConsentComponent } from './consent/consent.component';

const config: SocketIoConfig = {
  url: DeploymentConfig.SERVER_URL,
  options: { timeout: 60000, autoConnect: false },
};

@NgModule({
  declarations: [
    AppComponent,
    MainActivityComponent,
    PreSurveyComponent,
    PostPageComponent,
    ConsentComponent
  ],
  imports: [
    NgMultiSelectDropDownModule.forRoot(),
    OverlayscrollbarsModule,
    NgSelectModule,
    TooltipModule,
    AngularSplitModule.forRoot(),
    NouisliderModule,
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    SocketIoModule.forRoot(config),
    ReactiveFormsModule
  ],
  providers: [
    SessionPage,
    Message,
    MainActivityComponent,
    HttpErrorHandler,
    MessageService,
    ChatService,
    UtilsService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
