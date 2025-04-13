import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { MainActivityComponent } from "./main-activity/component";
import { ConsentComponent } from "./consent/consent.component";
import { PreSurveyComponent } from "./presurvey/presurvey.component";
import { PostPageComponent } from "./post-page/post-page.component";

const routes: Routes = [
  { path: "", redirectTo: "/consent", pathMatch: "full" },
  { path: "consent", component: ConsentComponent },
  { path: "presurvey", component: PreSurveyComponent },
  { path: "main", component: MainActivityComponent },
  { path: "post", component: PostPageComponent },
  { path: "**", redirectTo: "/consent" }  // Catch-all route
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
