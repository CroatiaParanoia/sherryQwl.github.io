### @click == (click);
### :src == [src];
### [(size)] 双向绑定 ????
### *ngIf == v-if
### *ngFor == v-for
### *ngSwitch 代码实例：
```html
<div [ngSwitch]="mapStatus">
    <p *ngSwitchCase="0">下载中...</p>
    <p *ngSwitchCase="1">正在读取...</p>
    <p *ngSwitchDefault>系统繁忙...</p>
</div>
```
```js
public mapStatus:number=1;
```

###  
```js
<ng-container> == <template>
```

### [ngClass] == :class

### [NgStyle] == :style

### [(ngModel)] == v-module

### 管道 == filters过滤器

### ngOnInit == created

### 
```js
<ng-content select=".my-class"></ng-content> == <slot name="">
```

***
##### 内容投影这个特性存在的意义是什么
### 组件标签不能嵌套使用。
### 不能优雅地包装原生的 HTML 标签。

***
#####  @Injectable 的用法
### 如果一个 Service 里面需要依赖其他 Service，需要使用 @Injectable 装饰器进行装饰

### imports 引入一个模块，使当前模块中的其他模块的导出声明可用；
### declarations 引入一个组件
###  encapsulation:ViewEncapsulation.None在@Component里面设置这个，可以修改ant-design的样式


### 命令行修改端口号
ng serve --port 4201 -- 把端口号由4200改为了4201