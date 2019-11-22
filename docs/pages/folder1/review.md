## 搭建项目
```js
npm install -g @angular/cli
ng new my-app
```
## module
NgModules 用于配置注入器和编译器，并帮你把那些相关的东西组织在一起。

NgModule 的元数据会做这些：

声明某些组件、指令和管道属于这个模块。

公开其中的部分组件、指令和管道，以便其它模块中的组件模板中可以使用它们。

导入其它带有组件、指令和管道的模块，这些模块中的元件都是本模块所需的。

提供一些供应用中的其它组件使用的服务。

用于规定哪些组件和指令属于它（declarations），以及它使用了哪些其它模块（imports）

## 依赖注入 
我们在组件中不应该关心数据是怎样获取的，数据要放在服务里面，组件可以通过依赖注入的方式来获取服务中的数据。

在组件中的constructor的参数里，注入需要的服务。

服务的声明要在service里面用Injectable装饰器去声明一个类为服务；providedIn是元数据，也就是给谁用，声明在哪个模块上面，默认是root，即在app.module

## 路由与导航 
路由：用 RouterModule.forRoot() 方法来配置路由器， 并把它的返回值添加到 AppModule 的 imports 数组中。

RouterOutlet 是一个来自路由模块中的指令，它的用法类似于组件。 它扮演一个占位符的角色，用于在模板中标出一个位置，路由器将会把要显示在这个出口处的组件显示在这里。类似router-view

根模块中使用forRoot()，子模块中使用forChild()

导航：router-link

## 懒加载
定义：即用到的时候才会加载 路由里面的component变成loadChildren，后面加上模块的位置

PreloadAllModules 的意思是：预加载所有模块，不管有没有被访问到。也就是说，要么就一次预加载所有异步模块，要么就彻底不做预加载。

熟悉angular的状态管理（跟服务相关）
服务的声明要在service里面用Injectable装饰器去声明一个类为服务；providedIn是元数据，也就是给谁用，一般元数据声明是root，即在app.module

也可以在模块（module.ts）的providers里面引入服务，服务的元数据就是当前的模块

也可以在组件component.ts的providers里面引入服务，服务的元数据就是当前的模块

了解rxjs的使用，对比promise
共同点：Promise 里面用的是 then() 和 resolve()，而 RxJS 里面用的是 subscribe() 和 next() 。

不同点： rxjs可以中途取消--可以通过 unsbscribe() 方法中途撤回；

可以发射多个值--next可以被调用多次，而resolve只能调用一次

有各种工具函数--filter、map

了解httpClient,对比axios
不同：httpClient返回的是rxjs对象，axios返回的是promise对象，httpClient可以当做一个服务注入到组件或者service里面。

共同：都提供get、post这一类的方法，都有拦截器，用来添加公共的配置和参数

## 如何使用服务端渲染