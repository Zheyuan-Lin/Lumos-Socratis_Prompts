import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { MainActivityComponent } from "./main-activity/component";
import { PostPageComponent } from "./post-page/post-page.component";
import { ExportPageComponent } from './export-page/export-page.component';

const routes: Routes = [
  { path: "", redirectTo: "/main", pathMatch: "full" },
  { path: "main", component: MainActivityComponent },
  { path: "post", component: PostPageComponent },
  { path: "export", component: ExportPageComponent },
  { path: "**", redirectTo: "/main" }  // Catch-all route
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
