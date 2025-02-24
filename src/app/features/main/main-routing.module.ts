import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {HomeComponent} from "./pages/home/home.component";

const routes: Routes = [
  { path: 'home', component: HomeComponent }, // Главная страница модуля main
  { path: '', redirectTo: 'home', pathMatch: 'full' }, // Перенаправление с корня на /home
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MainRoutingModule { }
