import { OnInit, Component } from '@angular/core';
import { Project, BuildInfo, JoinCorp } from 'src/app/shared/schemas/project';
import { ActivatedRoute, Router, Resolve } from '@angular/router';
import { FunctionPageBar } from 'src/app/shared/function-items/function-items';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { DataDefine, FireCheck } from '../schemas';
import { FireCheckService } from '../fire-check.service';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, startWith, pairwise } from 'rxjs/operators';
import { MatSelectChange } from '@angular/material/select';
import { Task } from 'src/app/business/schemas';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { ToastrService } from 'ngx-toastr';
import { CamundaRestService } from 'src/app/business/camunda-rest.service';
import { TaskRouterService } from 'src/app/business/tasks/task-router.service';
import { environment } from 'src/environments/environment';


const EXTRA_SMALL_WIDTH_BREAKPOINT = 768;
const SMALL_WIDTH_BREAKPOINT = 992;


@Component({
  selector:"fire-check-created",
  templateUrl:"./created.html",
})
export class FireCheckCreatedComponent implements OnInit{

  check: FireCheck;
  tasks: Task[];

  reportUrl = `${environment.fileUrl}/pdf/`;

  constructor(private _route: ActivatedRoute,
    private _taskRouter: TaskRouterService){}

  ngOnInit(): void {
    this._route.data.subscribe(data => {
      this.check = data.check;
      this.tasks = data.tasks;
    })
  }

  viewTask(i:number){
    this._taskRouter.view(this.tasks[i]);
  }
}

const fullBuildColumns = ['count','area' ,'height', 'length'];

@Component({
  selector:"fire-check-create",
  templateUrl:"./create.html",
  styleUrls:["./create.scss"]
})
export class FireCheckCreateComponent implements OnInit{

  project: Project;

  businessForm: FormGroup;

  checkForm: FormGroup;

  builds: BuildInfo[];

  buildColumns: string[] = ['name','property','rating','danger'];


  get buildForm(): FormArray{
    return this.businessForm.get('builds') as FormArray;
  }

  constructor(
    public dataDefine: DataDefine,
    private _fb: FormBuilder,
    private _route: ActivatedRoute,
    private _router: Router,
    private _fireCheckService: FireCheckService,
    private _uiLoader: NgxUiLoaderService,
    private _toastr: ToastrService,
    breakpoints: BreakpointObserver,
    _func: FunctionPageBar) {
      _func.loadTitle('建设工程消防验收');

        breakpoints.observe(`(max-width: ${EXTRA_SMALL_WIDTH_BREAKPOINT}px)`)
          .pipe(map(breakpoint => breakpoint.matches)).subscribe( extra => {
            this.buildColumns = this.buildColumns.filter(element => !fullBuildColumns.includes(element))
          });
      breakpoints.observe(`(max-width: ${SMALL_WIDTH_BREAKPOINT}px)`)
        .pipe(map(breakpoint => breakpoint.matches)).subscribe( small => {

          if (!this.buildColumns.includes(fullBuildColumns[0])){
            const i = this.buildColumns.indexOf('name');

            fullBuildColumns.reverse().forEach(item => {
              this.buildColumns.splice(i + 1,0,item);
            });
          }
          
        }
          
        );
  }



  onSubmit(){
    this._uiLoader.start();
  
    let value = JSON.parse(JSON.stringify(this.checkForm.value))
    if (value.info.fit && value.info.fit.part){
      console.log(value);
      value.info.fit.part = value.info.fit.part.join(',')
    }
    console.log(value);
    value.info.builds = value.info.builds.filter(build => build.selected).map(build => {return {property:build.property ,code: build.code, rating: build.rating, danger: build.danger}});
    value.memo = value.info.memo;
    this._fireCheckService.create(value).subscribe(
      val => {
        this._router.navigate(['../../','created',val.id],{relativeTo: this._route});
      },
      err => {
        this._uiLoader.stop();
        this._toastr.error("请联系管理员或请稍后再试！","存储数据失败");
        console.log(err);
      }
      );
  }

  
  tinChange(event: MatCheckboxChange){
    if (event.checked){
      this.businessForm.addControl('tin', this._fb.group({
        location: [, Validators.maxLength(64)],
        area: [],
        type: [,Validators.required],
        layout:[,Validators.required],
        name :[,[Validators.maxLength(32)]]
      }))
    }else{
      this.businessForm.removeControl('tin');
    }
  }

  squareChange(event: MatCheckboxChange){
    if (event.checked){
      this.businessForm.addControl('square', this._fb.group({
          area: [],
          name:[, [ Validators.maxLength(32)]],
      }))
    }else{
      this.businessForm.removeControl('square');
    }
  }

  ngOnInit(): void {
    this._route.data.subscribe(data => {
      this.project = data.project;



      this.businessForm = this._fb.group({

          projectCode: [this.project.code],
          contracts:[, [Validators.maxLength(64),Validators.required]],
          tel:[,[Validators.maxLength(16),Validators.required]],
          special:[,Validators.required],
          constructFile:[,Validators.maxLength(32)],
          constructFileDate:[],
          designFile:[{value: null, disabled: true},Validators.maxLength(32)],
          designFileDate:[{value: null, disabled: true}],
          part:[false],
          memo:[,Validators.maxLength(1024)],

          builds:this._fb.array([])

      });

      this.checkForm = this._fb.group({
        corp:[, Validators.required],
        info: this.businessForm
      });

      this.businessForm.get("special").valueChanges.subscribe(value => {
        if (value){
          this.businessForm.get("designFile").enable();
          this.businessForm.get("designFile").setValidators(Validators.required);
          this.businessForm.get("designFile").updateValueAndValidity();
          this.businessForm.get("designFileDate").enable(); 
          this.businessForm.get("designFileDate").setValidators(Validators.required);
          this.businessForm.get("designFileDate").updateValueAndValidity();

        }else{
          this.businessForm.get("designFile").disable();
          this.businessForm.get("designFile").setValue(null);
          this.businessForm.get("designFile").clearValidators();
          this.businessForm.get("designFile").updateValueAndValidity();
          this.businessForm.get("designFileDate").disable();   
          this.businessForm.get("designFileDate").setValue(null);
          this.businessForm.get("designFileDate").clearValidators();
          this.businessForm.get("designFileDate").updateValueAndValidity();
        }
      });


      

      this.businessForm.get("part").valueChanges.subscribe(value => {
        if (value){
          this.buildColumns.splice(0,0,'selected')
        }else{
          this.buildColumns = this.buildColumns.filter(item => item !== 'selected');
          this.buildForm.controls.forEach(item => {
            item.get("selected").setValue(true);
          })
        }
      })


      this.builds = this.project.builds.map(build => build.info);
      this.project.builds.forEach(build => {
        let buildItem = this._fb.group({

          code:[build.code],
          selected: [true],
          rating:[, Validators.required],
          danger:[, Validators.required],
          property:[]
        })

        buildItem.valueChanges
        .pipe(startWith(null), pairwise())
        .subscribe(([prev, next]: [any, any])=> {
          if (this.businessForm.get("part").value){
            if (!prev || (prev.selected !== next.selected)){
              let control = this.buildForm.controls.find(c => c.get('code').value === next.code);
              if (next.selected){
          
                control.get("rating").setValidators(Validators.required);
                control.get("rating").updateValueAndValidity();
                control.get("danger").setValidators(Validators.required);
                control.get("danger").updateValueAndValidity();
                console.log('add validators');
              }else{
                control.get("rating").clearValidators();
                control.get("rating").updateValueAndValidity();
                control.get("danger").clearValidators();
                control.get("danger").updateValueAndValidity();
                console.log('clear validators');
              }
            }
          }

        })

        this.buildForm.push(buildItem);
      })

      if (this.project.info.modifyFit){
        this.businessForm.addControl('fit', this._fb.group({
          part: [,Validators.required],
          area: [,Validators.required],
          layers: [,[Validators.maxLength(16), Validators.required]]
        }));
      }

      if (this.project.info.modifyWarm){
        this.businessForm.addControl('warm', this._fb.group({
          type: [,Validators.required],
          layers: [,[Validators.maxLength(16), Validators.required]],
          part: [,[Validators.maxLength(32), Validators.required]],
          material: [,[Validators.maxLength(32), Validators.required]]
        }))
      }

      if (this.project.info.modifyUse){
        this.businessForm.addControl('useChange', this._fb.group({
          oldUse:[,Validators.maxLength(16)],
          property:[]
        }))
      }



      

    })

  }

}