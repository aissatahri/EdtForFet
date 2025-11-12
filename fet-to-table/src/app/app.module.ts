import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard/dashboard.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AllProfessorComponent } from './professor/all-professor/all-professor.component';
import {CdkAccordionModule} from "@angular/cdk/accordion";
import {HttpClientInMemoryWebApiModule} from "angular-in-memory-web-api";
import {InMemoryDataService} from "./in-memory-data.service";
import {HttpClientModule} from "@angular/common/http";
import { LoaderComponent } from './loader/loader.component';
import { AllStudentComponent } from './student/all-student/all-student.component';
import { AllRoomComponent } from './room/all-room/all-room.component';
import { ProfGlobalComponent } from './global/prof-global/prof-global.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    AllProfessorComponent,
    LoaderComponent,
    AllStudentComponent,
    AllRoomComponent,
    ProfGlobalComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    CdkAccordionModule,
    HttpClientModule,
    HttpClientInMemoryWebApiModule.forRoot(InMemoryDataService, {dataEncapsulation : false})
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
