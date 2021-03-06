import {Injectable, Component, OnDestroy, ViewChild, OnInit} from '@angular/core';
import { Subject, Observable, combineLatest } from 'rxjs';
import { ActivatedRoute, Params } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';
import { takeUntil, map } from 'rxjs/operators';
import { BreakpointObserver } from '@angular/cdk/layout';
import { TableOfContents } from '../table-of-contents/table-of-contents';
import { CmsService } from 'src/app/cms/cms.service';

export interface FunctionItem {
  /** Id of the doc item. Used in the URL for linking to the doc. */
  id: string;
  /** Display name of the doc item. */
  name: string;
  /** Short summary of the doc item. */
  summary?: string;

  roles?: string[];
}

export interface FunctionCategory {
  id: string;
  name: string;
  items: FunctionItem[];
  summary?: string;

  roles?: string[];
}

export interface FunctionHeaderInfo {
  title: string;
  search: boolean;
}

const CDK = 'cdk';
const COMPONENTS = 'components';



const FUNCTIONS:  FunctionCategory[] = 
  [
    {
      id: 'project',
      name: '建设工程备案',
      summary: '建设工程备案.',
      items: [
        {
          id: 'project',
          name: '工程项目',
          summary: '工程项目.'
        },
        {
          id: 'corp',
          name: '责任主体',
          summary: '参建单位.'
        },
        {
          id: 'corp-cer',
          name: '信用管理',
          summary: '信用管理.'
        }
      ]
    },
    {
      id: 'fire',
      name: '工程消防',
      summary: '工程消防.',
      items: [
        {
          id: 'fire-business-design',
          name: '设计审查',
          summary: '设计审查.',
        },
        {
          id: 'fire-business',
          name: '建设工程消防验收',
          summary: '建设工程消防验收'
        },
        {
          id: 'fire-business-special',
          name: '特殊建设工程消防验收',
          summary: '特殊建设工程消防验收'
        },
        {
          id: 'fire-business-record',
          name: '建设工程消防验收备案',
          summary: '特殊建设工程消防验收'
        },
        {
          id: 'fire-business-radom',
          name: '建设工程消防备案抽查',
          summary: '建设工程消防备案抽查'
        }

        
      ]
    },
    // {
    //   id: 'quality',
    //   name: '工程质检',
    //   summary: '工程质检.',
    //   items: [
    //     {
    //       id: 'quality-params',
    //       name: '质检参数',
    //       summary: '质检参数.'
    //     },
    //     {
    //       id: 'quality-business',
    //       name: '质检业务',
    //       summary: '质检业务.'
    //     }
    //   ]
    // },
    // {
    //   id: 'files',
    //   name: '档案管理',
    //   summary: '档案管理.',
    //   items: [
    //     {
    //       id: 'files-room',
    //       name: '档案室'
    //     },
    //     {
    //       id: 'files-business',
    //       name: '档案业务'
    //     }
    //   ]
    // },
    {
      id: 'setting',
      name: '系统设置',
      summary: '系统设置.',
      items: [
        {
          id: 'employee',
          name: '用户管理',
          summary: '员工管理.'
        },
        // {
        //   id: 'config',
        //   name: '系统设置',
        //   summary: '系统设置.'
        // }
      ]
    }
  ];

const ALL_FUNCTIONS_ITEM = FUNCTIONS.reduce(
    (result: FunctionItem[], category: FunctionCategory) => result.concat(category.items), []);


export class SearchCondition{
  key: string;
  now: boolean;
}

@Injectable({providedIn: 'root'})
export class FunctionPageBar {

  private _originalTitle = environment.title;
  private _info: FunctionHeaderInfo = {title: '', search: false};

  private search$ = new Subject<SearchCondition>();

  private loading$ = new Subject<FunctionHeaderInfo>();


  doSearch(key: SearchCondition){
    this.search$.next(key);
  }

  loadTitle(title: string){
    this.info = {title: title, search: false};
    this.loading$.next(this.info);
  } 

  loadTitleFunction(id: string){
    return this.loadTitle(this.getItemById(id).name);
  }

  loadSearch(info: FunctionHeaderInfo): Observable<SearchCondition>{
    this.info = info;
    this.loading$.next(this.info)
    return this.search$.asObservable();
  }

  loadSearchFunction(id: string): Observable<SearchCondition>{
    return this.loadSearch({title: this.getItemById(id).name, search: true});
  }

  get info(): FunctionHeaderInfo { 
    return this._info; 
  }

  getLoad(): Observable<FunctionHeaderInfo>{
    return this.loading$.asObservable();
  }

  set info(info: FunctionHeaderInfo) {

    this._info = info;

    let _title = '';
    if (info.title !== '') {
      _title = `${info.title} | ${this._originalTitle}`;
    } else {
      _title = this._originalTitle;
    }
    this.bodyTitle.setTitle(_title);
  }

  constructor(private bodyTitle: Title,private _cmsSvr: CmsService){
    this._cmsSvr.categorys().pipe(
      map(c => c
        .map((c) :FunctionCategory  => ({id: c.id.toString(), name: c.name, summary: c.description, items: c.children.map((ci):FunctionItem => ({id: `article/${ci.id}`, name:ci.name,summary: ci.description }))})
        
        )
      )
    ).subscribe(cms => {

      this.functions = FUNCTIONS.concat(cms);
      this.allFunctionItem = this.functions.reduce(
        (result: FunctionItem[], category: FunctionCategory) => result.concat(category.items), []
      )
    })
  }

  functions:FunctionCategory[];

  allFunctionItem: FunctionItem[];

  getCategories(): FunctionCategory[] {
    return this.functions;
  }

  getItems(): FunctionItem[] {
    return this.allFunctionItem;
  }

  getItemById(id: string): FunctionItem | undefined {
    return this.allFunctionItem.find(f => f.id === id);
  }

  getCategoryById(id: string): FunctionCategory | undefined {
    return this.functions.find(c => c.id === id);
  }


}

export abstract class PageFunctionBase implements OnDestroy{

  constructor(_route: ActivatedRoute, _func: FunctionPageBar){

    // parent awaly is function ?
    _route.parent.url.pipe(takeUntil(this._destroyed)).subscribe(url => {
        if (url.length > 0){    
          _func.loadTitleFunction(url[0].path);
        }else{
          throw new Error("path not found: " + url);
        }     
      });
  }

  private _destroyed = new Subject();

  ngOnDestroy(): void {
    this._destroyed.next();
    this._destroyed.complete();
  }

}

export abstract class TocPageFunctionBase extends PageFunctionBase implements OnInit{

  @ViewChild('toc') tableOfContents: TableOfContents;

  showToc: Observable<boolean>;

  destroyed = new Subject<void>();

  constructor(_route: ActivatedRoute, _func: FunctionPageBar,
      breakpointObserver: BreakpointObserver) {
      super(_route,_func);
    this.showToc = breakpointObserver.observe('(max-width: 1200px)')
      .pipe(map(result => !result.matches));
  }

  ngOnInit(): void {
      if (this.tableOfContents) {
        this.tableOfContents.resetHeaders();
      }
  }

  updateTableOfContents(sectionName: string, docViewerContent: HTMLElement, sectionIndex = 0) {
    console.log("add table contents:" + sectionName)
    if (this.tableOfContents) {
      this.tableOfContents.addHeaders(sectionName, docViewerContent, sectionIndex);
      this.tableOfContents.updateScrollPosition();
    }
  }

}

export abstract class SearchFunctionBase implements OnDestroy{

  abstract doSearch(key: SearchCondition):void;

  private _destroyed = new Subject();

  constructor(_route: ActivatedRoute, _func: FunctionPageBar){

    // parent awaly is function ?
    _route.parent.url.pipe(takeUntil(this._destroyed)).subscribe(url => {
        //console.log(url);
        if (url.length > 0){    
          _func.loadSearchFunction(url[0].path).pipe(takeUntil(this._destroyed)).subscribe(key => this.doSearch(key));
        }else{
          throw new Error("path not found: " + url);
        }     
      });
  }
  
  ngOnDestroy(): void {
    this._destroyed.next();
    this._destroyed.complete();
  }




} 
