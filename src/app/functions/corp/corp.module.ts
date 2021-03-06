import { NgModule, Injectable, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule, CanActivate, Router, ActivatedRoute, Resolve } from '@angular/router';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgxUiLoaderModule } from 'ngx-ui-loader';

import {MatCardModule} from '@angular/material/card';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatMenuModule} from '@angular/material/menu';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { MatMomentDateModule } from "@angular/material-moment-adapter";
import {MatChipsModule} from '@angular/material/chips';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatTabsModule} from '@angular/material/tabs';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTableModule} from '@angular/material/table';
import { OcticonModule } from 'src/app/tools/octicon/octicon.directive';

import { ConfirmDialogModule } from 'src/app/shared/confirm-dialog/confirm-dialog.component';


import { CorpProjectsComponent, CorpBusinessComponent, CorpInfoComponent, CorpDetailsComponent, CorpEmployeeComponent, CorpEmployeeEditorDialogComponent, CorpCreditComponent } from './corp-details.component';
import { CorpListResolver } from './corp-list.resolver';
import { CorpComponent, CorpEditComponent } from './corp.component';
import { SharedDataModule } from 'src/app/shared/schemas/data.module';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CorpService } from '../../shared/remote-services/corp.service';
import { map } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { CorpResolver } from 'src/app/shared/resolver/corp.resolver';
import { CorpEmployee } from 'src/app/shared/schemas/corp';
import { MatDialogModule } from '@angular/material/dialog';
import {MatListModule} from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { CerType } from './cer/credit-add.module';


@Pipe({name: 'corpCreditTypeLabel'})
export class CorpCreditTypePipe implements PipeTransform{
  transform(value: string) {
    return CerType[value]
  }

}

@Injectable({
  providedIn: 'root'
})
export class InBusinessGuard implements  CanActivate{

  constructor(private _service: CorpService,private _toastr: ToastrService){}

  canActivate(route: import("@angular/router").ActivatedRouteSnapshot, state: import("@angular/router").RouterStateSnapshot): boolean | import("@angular/router").UrlTree | import("rxjs").Observable<boolean | import("@angular/router").UrlTree> | Promise<boolean | import("@angular/router").UrlTree> {
    const id = Number(route.paramMap.get("id"));
    return this._service.corpInBusiness(id).pipe(
      map(exists => {
        if (exists){
          // this._router.navigate([state..,'details',id,'info'],{relativeTo:this._route});
          this._toastr.warning('此企业正在办理备案业务,不能进行编辑操作!');

        }
        return !exists;
      }),
    )
  }

}


@Injectable({providedIn: 'root'})
export class CorpEmployeeListResolver implements Resolve<CorpEmployee[]>{

  constructor(private service: CorpService){

  }

  resolve(route: import("@angular/router").ActivatedRouteSnapshot, state: import("@angular/router").RouterStateSnapshot): CorpEmployee[] | import("rxjs").Observable<CorpEmployee[]> | Promise<CorpEmployee[]> {
    return this.service.listCorpEmployee(route.parent.params['cid']);
  }

  
}


const routes: Routes =[
    {path: '' , component: CorpComponent, runGuardsAndResolvers: 'paramsOrQueryParamsChange', resolve:{dataPage: CorpListResolver}},
    {path: 'edit', component: CorpEditComponent},
    {path: 'edit/:cid', component: CorpEditComponent,canActivate: [InBusinessGuard], resolve: {corp: CorpResolver}},
    {path: 'details/:cid', 
      component: CorpDetailsComponent, 
      children:[
        {path: 'info', component: CorpInfoComponent, resolve: {corp: CorpResolver}},
        {path: 'business', component: CorpBusinessComponent},
        {path: 'projects' , component: CorpProjectsComponent},
        {path: 'credit', component: CorpCreditComponent},
        {path: 'employee', component: CorpEmployeeComponent, resolve: {employees: CorpEmployeeListResolver}}
      ]
    }
  ]
  
  @NgModule({
    declarations: [
      CorpComponent,
      CorpEditComponent,
      CorpDetailsComponent,
      CorpProjectsComponent,
      CorpBusinessComponent,
      CorpInfoComponent,
      CorpEmployeeComponent,
      CorpCreditComponent,
      CorpEmployeeEditorDialogComponent,
      CorpCreditTypePipe
      ],
    imports: [
      CommonModule,
      ReactiveFormsModule,
      FontAwesomeModule,
      MatButtonModule,
      MatIconModule,
      MatCardModule,
      MatInputModule,
      MatSelectModule,
      MatMenuModule,
      MatDatepickerModule,
      MatMomentDateModule,
      MatPaginatorModule,
      MatChipsModule,
      MatTabsModule,
      MatTooltipModule,
      MatTableModule,
      MatProgressSpinnerModule,
      NgxUiLoaderModule,
      ConfirmDialogModule,
      MatSlideToggleModule,
      OcticonModule,
      MatListModule,
      MatDividerModule,
      RouterModule.forChild(routes),
      SharedDataModule,
      MatDialogModule
    ],
    entryComponents:[
      CorpEmployeeEditorDialogComponent
    ],
    exports:[CorpCreditTypePipe]
  
  })
  export class CorpModule { }