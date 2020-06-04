import { OnInit, Component } from '@angular/core';
import { Project, BuildInfo, JoinCorp } from 'src/app/shared/schemas/project';
import { ActivatedRoute } from '@angular/router';
import { FunctionPageBar } from 'src/app/shared/function-items/function-items';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { DataDefine, FireCheck } from './schemas';
import { FireCheckService } from './fire-check.service';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatSelectChange } from '@angular/material/select';
import { Task } from 'src/app/business/schemas';


const EXTRA_SMALL_WIDTH_BREAKPOINT = 768;
const SMALL_WIDTH_BREAKPOINT = 992;

@Component({
  selector:"fire-check-created",
  templateUrl:"./created.html",
})
export class FireCheckCreatedComponent implements OnInit{

  check: FireCheck;
  tasks: Task;

  constructor(private _route: ActivatedRoute){}

  ngOnInit(): void {
    this._route.data.subscribe(data => {
      this.check = data.check;
      this.tasks = data.tasks;
    })
  }

}

@Component({
  selector:"fire-check-create",
  templateUrl:"./create.html",
  styleUrls:["./create.scss"]
})
export class FireCheckCreateComponent implements OnInit{

  project: Project;

  businessForm: FormGroup;

  builds: BuildInfo[];

  buildColumns: string[] = ['name','count','rating','danger'];;

  corpCtl: FormControl = new FormControl(Validators.required);

  get buildForm(): FormArray{
    return this.businessForm.get('builds') as FormArray;
  }

  constructor(
    public dataDefine: DataDefine,
    private _fb: FormBuilder,
    private _route: ActivatedRoute,
    private _fireCheckService: FireCheckService,
    breakpoints: BreakpointObserver,
    _func: FunctionPageBar) {
      _func.loadTitle('建设工程消防验收');

        breakpoints.observe(`(max-width: ${EXTRA_SMALL_WIDTH_BREAKPOINT}px)`)
          .pipe(map(breakpoint => breakpoint.matches)).subscribe( extra => {

              this.buildColumns = ['name','rating','danger'];
          });
      breakpoints.observe(`(max-width: ${SMALL_WIDTH_BREAKPOINT}px)`)
        .pipe(map(breakpoint => breakpoint.matches)).subscribe( small => {
          
        
            this.buildColumns = ['name','count','area' ,'height','rating','danger'];
            
        }
          
        );
  }


  onSubmit(){
    console.log(this.businessForm.value);
    this._fireCheckService.create(this.businessForm.value).subscribe(val => (console.log(val)));
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
      this.builds = this.project.builds.map(build => build.info);


      this.businessForm = this._fb.group({
        corp:[,Validators.required],
        corpProperty:[],
        property:[],
        projectCode: [this.project.code],
        contracts:[, Validators.maxLength(64)],
        tel:[,Validators.maxLength(16)],

        applyFile:[,Validators.maxLength(32)],
        fireFile:[,Validators.maxLength(32)],
        constructFile:[,Validators.maxLength(32)],

        part:[],
        memo:[,Validators.maxLength(1024)],
        oldUse:[,Validators.maxLength(16)],
        builds:this._fb.array([])
      })

      this.builds = this.project.builds.map(build => build.info);
      this.project.builds.forEach(build => {
        this.buildForm.push(this._fb.group({
          code:[build.code],
          rating:[, Validators.required],
          danger:[, Validators.required]
        }))
      })

      if (this.project.info.modifyFit){
        this.businessForm.addControl('fit', this._fb.group({
          part: [,Validators.required],
          area: [],
          layers: []
        }));
      }

      if (this.project.info.modifyWarm){
        this.businessForm.addControl('warm', this._fb.group({
          type: [,Validators.required],
          layers: []
        }))
      }

      
      this.corpCtl.valueChanges.subscribe(value => {
        if (value){
          this.businessForm.get('corp').setValue(value.code);
          this.businessForm.get('corpProperty').setValue(value.property);
        }else{
          this.businessForm.get('corp').setValue(null);
          this.businessForm.get('corpProperty').setValue(null);
        }
      })

    })

  }

}