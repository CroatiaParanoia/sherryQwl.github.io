
### vue.js响应式原理解析与实现
``` js
class Observer {
  constructor(data) {
    // 如果不是对象，则返回
    if (!data || typeof data !== 'object') {
      return;
    }
    this.data = data;
    this.walk();
  }

  // 对传入的数据进行数据劫持
  walk() {
    for (let key in this.data) {
      this.defineReactive(this.data, key, this.data[key]);
    }
  }
  // 创建当前属性的一个发布实例，使用Object.defineProperty来对当前属性进行数据劫持。
  defineReactive(obj, key, val) {
    // 创建当前属性的发布者
    const dep = new Dep();
    /*
    * 递归对子属性的值进行数据劫持，比如说对以下数据
    * let data = {
    *   name: 'cjg',
    *   obj: {
    *     name: 'zht',
    *     age: 22,
    *     obj: {
    *       name: 'cjg',
    *       age: 22,
    *     }
    *   },
    * };
    * 我们先对data最外层的name和obj进行数据劫持，之后再对obj对象的子属性obj.name,obj.age, obj.obj进行数据劫持，层层递归下去，直到所有的数据都完成了数据劫持工作。
    */
    new Observer(val);
    Object.defineProperty(obj, key, {
      get() {
        // 若当前有对该属性的依赖项，则将其加入到发布者的订阅者队列里
        if (Dep.target) {
          dep.addSub(Dep.target);
        }
        return val;
      },
      set(newVal) {
        if (val === newVal) {
          return;
        }
        val = newVal;
        new Observer(newVal);
        dep.notify();
      }
    })
  }
}

// 发布者,将依赖该属性的watcher都加入subs数组，当该属性改变的时候，则调用所有依赖该属性的watcher的更新函数，触发更新。
class Dep {
  constructor() {
    this.subs = [];
  }

  addSub(sub) {
    if (this.subs.indexOf(sub) < 0) {
      this.subs.push(sub);
    }
  }

  notify() {
    this.subs.forEach((sub) => {
      sub.update();
    })
  }
}

Dep.target = null;

// 观察者
class Watcher {
  /**
   *Creates an instance of Watcher.
   * @param {*} vm
   * @param {*} keys
   * @param {*} updateCb
   * @memberof Watcher
   */
  constructor(vm, keys, updateCb) {
    this.vm = vm;
    this.keys = keys;
    this.updateCb = updateCb;
    this.value = null;
    this.get();
  }

  // 根据vm和keys获取到最新的观察值
  get() {
    Dep.target = this;
    const keys = this.keys.split('.');
    let value = this.vm;
    keys.forEach(_key => {
      value = value[_key];
    });
    this.value = value;
    Dep.target = null;
    return this.value;
  }

  update() {
    const oldValue = this.value;
    const newValue = this.get();
    if (oldValue !== newValue) {
      this.updateCb(oldValue, newValue);
    }
  }
}

let data = {
  name: 'cjg',
  obj: {
    name: 'zht',
  },
};

new Observer(data);
// 监听data对象的name属性，当data.name发现变化的时候，触发cb函数
new Watcher(data, 'name', (oldValue, newValue) => {
  console.log(oldValue, newValue);
})

data.name = 'zht';

// 监听data对象的obj.name属性，当data.obj.name发现变化的时候，触发cb函数
new Watcher(data, 'obj.name', (oldValue, newValue) => {
  console.log(oldValue, newValue);
})

data.obj.name = 'cwc';
data.obj.name = 'dmh';
```
#### Dep
当对data上的对象进行修改值的时候会触发它的setter，那么取值的时候自然就会触发getter事件，所以我们只要在最开始进行一次render，那么所有被渲染所依赖的data中的数据就会被getter收集到Dep的subs中去。在对data中的数据进行修改的时候setter只会触发Dep的subs的函数。

定义一个依赖收集类Dep。
``` js
class Dep () {
    constructor () {
        this.subs = [];
    }

    addSub (sub: Watcher) {
        this.subs.push(sub)
    }

    removeSub (sub: Watcher) {
        remove(this.subs, sub)
    }

    notify () {
        // stabilize the subscriber list first
        const subs = this.subs.slice()
        for (let i = 0, l = subs.length; i < l; i++) {
            subs[i].update()
        }
    }
}
```

#### Watcher
订阅者，当依赖收集的时候回addSub到sub中，在修改data中数据的时候会触发Watcher的notify，从而回调渲染函数。
``` js
class Watcher () {
    constructor (vm, expOrFn, cb, options) {
        this.cb = cb;
        this.vm = vm;

        /*在这里将观察者本身赋值给全局的target，只有被target标记过的才会进行依赖收集*/
        Dep.target = this;

        /*触发渲染操作进行依赖收集*/
        this.cb.call(this.vm);
    }

    update () {
        this.cb.call(this.vm);
    }
}
```
#### 开始依赖收集
``` js
class Vue {
    constructor(options) {
        this._data = options.data;
        observer(this._data, options.render);
        let watcher = new Watcher(this, );
    }
}

function defineReactive (obj, key, val, cb) {
    ／*在闭包内存储一个Dep对象*／
    const dep = new Dep();

    Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        get: ()=>{
            if (Dep.target) {
                /*Watcher对象存在全局的Dep.target中*/
                dep.addSub(Dep.target);
            }
        },
        set:newVal=> {
            /*只有之前addSub中的函数才会触发*/
            dep.notify();
        }
    })
}

Dep.target = null;
```
将观察者Watcher实例赋值给全局的Dep.target，然后触发render操作只有被Dep.target标记过的才会进行依赖收集。有Dep.target的对象会讲Watcher的实例push到subs中，在对象被修改出发setter操作的时候dep会调用subs中的Watcher实例的update方法进行渲染。

https://blog.csdn.net/dadadeganhuo/article/details/88043001

https://www.cnblogs.com/ajianbeyourself/p/8962813.html#_label0

[知乎(目前说得最清楚的)](https://zhuanlan.zhihu.com/p/45081605)

## Vue组件懒加载
## watch 和computed的区别
#### Computed

可以关联多个实时计算的对象，当这些对象中的其中一个改变时都会出发这个属性。具有缓存能力，所以只有当数据再次改变时才会重新渲染，否则就会直接拿取缓存中的数据。
computed有缓存机制，只有改变时才执行，性能更佳；
#### Watch
在数据变化的同时进行异步操作或者是比较大的开销，那么watch为最佳选择。
## slot
[深入理解vue中的slot与slot-scope](https://segmentfault.com/a/1190000012996217)

插槽，也就是slot，是组件的一块HTML模板，这块模板显示不显示、以及怎样显示由父组件来决定。 

实际上，一个slot最核心的两个问题这里就点出来了，是显示不显示和怎样显示。

由于插槽是一块模板，所以，对于任何一个组件，从模板种类的角度来分，其实都可以分为非插槽模板和插槽模板两大类。
非插槽模板指的是html模板，指的是‘div、span、ul、table’这些，非插槽模板的显示与隐藏以及怎样显示由插件自身控制；插槽模板是slot，它是一个空壳子，因为它显示与隐藏以及最后用什么样的html模板显示由父组件控制。但是插槽显示的位置确由子组件自身决定，slot写在组件template的哪块，父组件传过来的模板将来就显示在哪块。

#### 单个插槽 | 默认插槽 | 匿名插槽
单个插槽可以放置在组件的任意位置，但是就像它的名字一样，一个组件中只能有一个该类插槽。相对应的，具名插槽就可以有很多个，只要名字（name属性）不同就可以了。

下面通过一个例子来展示。

父组件：
```html
<template>
    <div class="father">
        <h3>这里是父组件</h3>
        <child>
            <div class="tmpl">
              <span>菜单1</span>
              <span>菜单2</span>
              <span>菜单3</span>
              <span>菜单4</span>
              <span>菜单5</span>
              <span>菜单6</span>
            </div>
        </child>
    </div>
</template>
```

子组件：
```html
<template>
    <div class="child">
        <h3>这里是子组件</h3>
        <slot></slot>
    </div>
</template>

<!-- 在这个例子里，因为父组件在<child></child>里面写了html模板，那么子组件的匿名插槽这块模板就是下面这样。也就是说，子组件的匿名插槽被使用了，是被下面这块模板使用了。 -->

<div class="tmpl">
  <span>菜单1</span>
  <span>菜单2</span>
  <span>菜单3</span>
  <span>菜单4</span>
  <span>菜单5</span>
  <span>菜单6</span>
</div>
```
最终的渲染结果如图所示：
![image](https://segmentfault.com/img/remote/1460000012996222?w=782&h=342)

    注：所有demo都加了样式，以方便观察。其中，父组件以灰色背景填充，子组件都以浅蓝色填充。

#### 具名插槽
匿名插槽没有name属性，所以是匿名插槽，那么，插槽加了name属性，就变成了具名插槽。具名插槽可以在一个组件中出现N次。出现在不同的位置。下面的例子，就是一个有两个具名插槽和单个插槽的组件，这三个插槽被父组件用同一套css样式显示了出来，不同的是内容上略有区别。

父组件：
```html
<template>
  <div class="father">
    <h3>这里是父组件</h3>
    <child>
      <div class="tmpl" slot="up">
        <span>菜单1</span>
        <span>菜单2</span>
        <span>菜单3</span>
        <span>菜单4</span>
        <span>菜单5</span>
        <span>菜单6</span>
      </div>
      <div class="tmpl" slot="down">
        <span>菜单-1</span>
        <span>菜单-2</span>
        <span>菜单-3</span>
        <span>菜单-4</span>
        <span>菜单-5</span>
        <span>菜单-6</span>
      </div>
      <div class="tmpl">
        <span>菜单->1</span>
        <span>菜单->2</span>
        <span>菜单->3</span>
        <span>菜单->4</span>
        <span>菜单->5</span>
        <span>菜单->6</span>
      </div>
    </child>
  </div>
</template>
```

子组件：
```html
<template>
  <div class="child">
    // 具名插槽
    <slot name="up"></slot>
    <h3>这里是子组件</h3>
    // 具名插槽
    <slot name="down"></slot>
    // 匿名插槽
    <slot></slot>
  </div>
</template>
```
显示结果如图：

![image](https://segmentfault.com/img/remote/1460000012996223?w=742&h=456)

可以看到，父组件通过html模板上的slot属性关联具名插槽。没有slot属性的html模板默认关联匿名插槽。

#### 作用域插槽 | 带数据的插槽
最后，就是我们的作用域插槽。这个稍微难理解一点。官方叫它作用域插槽，实际上，对比前面两种插槽，我们可以叫它带数据的插槽。什么意思呢，就是前面两种，都是在组件的template里面写
```html
匿名插槽
<slot></slot>
具名插槽
<slot name="up"></slot>
```

但是**作用域插槽要求，在slot上面绑定数据**。也就是你得写成大概下面这个样子。
```html
<slot name="up" :data="data"></slot>
 export default {
    data: function(){
      return {
        data: ['zhangsan','lisi','wanwu','zhaoliu','tianqi','xiaoba']
      }
    },
}
```
我们前面说了，插槽最后显示不显示是看父组件有没有在child下面写模板，像下面那样
```html
<child>
   html模板
</child>
```
写了，插槽就总得在浏览器上显示点东西，东西就是html该有的模样，没写，插槽就是空壳子，啥都没有。
OK，我们说有html模板的情况，就是父组件会往子组件插模板的情况，那到底插一套什么样的样式呢，这由父组件的html+css共同决定，但是这套样式里面的内容呢？

正因为作用域插槽绑定了一套数据，父组件可以拿来用。于是，情况就变成了这样：==样式父组件说了算，但内容可以显示子组件插槽绑定的==。

我们再来对比，作用域插槽和单个插槽和具名插槽的区别，因为单个插槽和具名插槽不绑定数据，所以父组件是提供的模板要既包括样式由包括内容的，上面的例子中，你看到的文字，“菜单1”，“菜单2”都是父组件自己提供的内容；而作用域插槽，父组件只需要提供一套样式（在确实用作用域插槽绑定的数据的前提下）。

下面的例子，你就能看到，父组件提供了三种样式(分别是flex、ul、直接显示)，都没有提供数据，数据使用的都是子组件插槽自己绑定的那个人名数组。

父组件：
```html
<template>
  <div class="father">
    <h3>这里是父组件</h3>
    <!--第一次使用：用flex展示数据-->
    <child>
      <template slot-scope="user">
        <div class="tmpl">
          <span v-for="item in user.data">{{item}}</span>
        </div>
      </template>

    </child>

    <!--第二次使用：用列表展示数据-->
    <child>
      <template slot-scope="user">
        <ul>
          <li v-for="item in user.data">{{item}}</li>
        </ul>
      </template>

    </child>

    <!--第三次使用：直接显示数据-->
    <child>
      <template slot-scope="user">
       {{user.data}}
      </template>

    </child>

    <!--第四次使用：不使用其提供的数据, 作用域插槽退变成匿名插槽-->
    <child>
      我就是模板
    </child>
  </div>
</template>
```
子组件：
```html
<template>
  <div class="child">

    <h3>这里是子组件</h3>
    // 作用域插槽
    <slot  :data="data"></slot>
  </div>
</template>

 export default {
    data: function(){
      return {
        data: ['zhangsan','lisi','wanwu','zhaoliu','tianqi','xiaoba']
      }
    }
}
```
结果如图所示：

![image](https://segmentfault.com/img/remote/1460000012996224?w=703&h=651)





## vue的项目性能优化

* vue组件懒加载
* 减少watch的使用，慎用deep watch
* v-if 和 v-show选择调用
* 为item设置唯一key值
* 内容类系统的图片资源按需加载
    * 在列表数据进行遍历渲染时，需要为每一项item设置唯一key值，方便vuejs内部机制精准找到该条列表数据。当state更新时，新的状态值和旧的状态值对比，较快地定位到diff。

## 路由钩子
* 全局守卫
* 路由独享守卫
* 组件独享守卫

#### 全局守卫
很好理解，全局守卫就是能监听到全局的router动作
* router.beforeEach 路由前置时触发
``` js
const router = new VueRouter({ ... })
// to 要进入的目标路由对象
// from 当前的路由对象
// next resolve 这个钩子，next执行效果由next方法的参数决定
// next() 进入管道中的下一个钩子
// next(false) 中断当前导航
// next({path}) 当前导航会中断，跳转到指定path
// next(error) 中断导航且错误传递给router.onErr回调
// 确保前置守卫要调用next，否然钩子不会进入下一个管道
router.beforeEach((to, from, next) => {
  // ...
})
```
* router.afterEach 路由后置时触发
```js
// 与前置守卫基本相同，不同是没有next参数
router.afterEach((to, from) => {
  // ...
})
```
* router.beforeResolve 跟router.beforeEach类似,在所有组件内守卫及异步路由组件解析后触发

#### 路由独享守卫
参数及意义同全局守卫，只是定义的位置不同
```js
const router = new VueRouter({
  routes: [
    {
      path: '/',
      component: Demo,
      beforeEnter: (to, from, next) => {
        // ...
      },
      afterEnter: (to, from, next) => {
        // ...
      },
      
    }
  ]
})
```

#### 组件独享守卫
组件内新一个守卫, beforeRouteUpdate,在组件可以被复用的情况下触发，如 /demo/:id, 在/demo/1 跳转/demo/2的时候，/demo 可以被复用，这时会触发beforeRouteUpdate

```js
const Demo = {
  template: `...`,
  beforeRouteEnter (to, from, next) {
    ...
  },
  // 在当前路由改变，但是该组件被复用时调用
  beforeRouteUpdate (to, from, next) {
    ...
  },
  beforeRouteLeave (to, from, next) {
    ...
  }
}
```
注意在beforeRouteEnter前不能拿到当前组件的this，因为组件还有被创建，我们可以通过next(vm => {console.log(vm)}) 回传当前组件的this进行一些逻辑操作

vue-router中钩子分为全局的，局部的，以及组件三种形式, 他们都有前置守卫以及后置守卫, 其中组件的前置守卫不能拿到当前组件的this，因组件还没有被创建，可以通过next的参数进行回传this，前置守卫必须调用next方法，否则不会进入下一个管道

## keepalive
我们平时开发中, 总有部分组件没有必要多次init, 我们需要将组件进行持久化，使组件状态维持不变，在下一次展示时， 也不会进行重新init

keepalive音译过来就是保持活着, 所以在vue中我们可以使用keepalive来进行组件缓存

基本使用
```js
// 被keepalive包含的组件会被进行缓存
<keep-alive>
    <component />
</keep-alive>
```

上面提到被keepalive包含的组件不会被再次init，也就意味着不会重走生命周期函数, 但是平常工作中很多业务场景是希望我们缓存的组件在再次渲染的能做一些事情,vue为keepalive提供了两个额外的hook
* activated 当keepalive包含的组件再次渲染的时候触发
* deactivated 当keepalive包含的组件销毁的时候触发

注: 2.1.0 版本后keepalive包含但被exclude排除的组件不会有以上两个hook

#### 参数
keepalive可以接收3个属性做为参数进行匹配对应的组件进行缓存
* include 包含的组件
* exclude 排除的组件
* max 缓存组件的最大值

其中include,exclude可以为字符，数组，以及正则表达式，max 类型为字符或者数字

代码理解
``` js
// 只缓存组件name为a或者b的组件
<keep-alive include="a,b"> 
  <component :is="currentView" />
</keep-alive>

// 组件名为c的组件不缓存
<keep-alive exclude="c"> 
  <component :is="currentView"/>
</keep-alive>

// 如果同时使用include,exclude,那么exclude优先于include， 下面的例子也就是只缓存a组件
<keep-alive include="a,b" exclude="b"> 
  <component :is="currentView"/>
</keep-alive>

// 如果缓存的组件超过了max设定的值5，那么将删除第一个缓存的组件
<keep-alive exclude="c" max="5"> 
  <component :is="currentView"/>
</keep-alive>
```
## 虚拟DOM
## 前端鉴权
## vue的响应式原理、依赖收集、监听数组、虚拟dom等等
## 手写vue的mixin方法
## 抽取了哪些vue组件
## vue里面哪儿不会用到双向绑定
## 深入解析Vue依赖收集原理
#### 一、先谈观察者模式
观察者模式是一种实现一对多关系解耦的行为设计模式。它主要涉及两个角色：观察目标、观察者。

它的特点：观察者要直接订阅观察目标，观察目标一做出通知，观察者就要进行处理（这也是观察者模式区别于发布/订阅模式的最大区别）

++解释： 有些地方说观察者模式和发布/订阅模式是一样的，其实是不完全等同的，发布/订阅模式中，其解耦能力更近一步，发布者只要做好消息的发布，而不关心消息有没有订阅者订阅。而观察者模式则要求两端同时存在++

观察者模式，实现如下：
``` js
// 观察者集合
class ObserverList {
    constructor() {
        this.list = [];
    }
    add(obj) {
        this.list.push(obj);
    }
    removeAt(index) {
        this.list.splice(index, 1);
    }
    count() {
        return this.list.length;
    }
    get(index) {
        if (index < 0 || index >= this.count()) {
            return;
        }
        return this.list[index];
    }
    indexOf(obj, start = 0) {
        let pos = start;
        while (pos < this.count()) {
            if (this.list[pos] === obj) {
                return pos;
            }
            pos++;
        }
        return -1;
    }
}
// 观察者类
class Observer {
    constructor(fn) {
        this.update = fn;
    }
}
// 观察目标类
class Subject {
    constructor() {
        this.observers = new ObserverList(); 
    }
    addObserver(observer) {
        this.observers.add(observer);
    }
    removeObserver(observer) {
        this.observers.removeAt(
            this.observers.indexOf(observer)
        );
    }
    notify(context) {
        const count = this.observers.count();
        for (let i = 0; i < count; ++i) {
            this.observers.get(i).update(context);
        }
    }
}
```

现在，假设我们需要在数据A变更时，打印A的最新值，则用上述的代码实现如下：
```js
const observer = new Observer((newval) => {
    console.log(`A的最新值是${newval}`);
})
const subject = new Subject();
subject.addObserver(observer);
// 现在，做出A最新值改变的通知
> subject.notify('Hello, world');
// 控制台输出：
< 'Hello, world'
```

#### 二、Vue与Vue的依赖收集
Vue是一个实现数据驱动视图的框架。

我们都知道，Vue能够实现当一个数据变更时，视图就进行刷新，而且用到这个数据的其他地方也会同步变更；而且，这个数据必须是在有被依赖的情况下，视图和其他用到数据的地方才会变更。 所以，Vue要能够知道一个数据是否被使用，实现这种机制的技术叫做**依赖收集**。
根据Vue官方文档的介绍，其原理如下图所示：
![image](https://pic1.zhimg.com/80/v2-5de7af21d4c2de951720c006f84b98fc_hd.jpg)

每个组件实例都有相应的watcher实例。渲染组件的过程，会把属性记录为依赖 。当我们操纵一个数据时，**依赖项的setter会被调用，从而通知watcher重新计算**，从而致使与之相关联的组件得以更新。那么，现在问题来了：~~挖掘机技术哪家强，……~~ 如果我们现在模板里用到了3个数据A、B、C，那么我们怎么处理A、B、C变更时能刷新视图呢？ 这就要先考虑以下两个问题：

1、我们怎么知道模板里用到了哪些数据？ 

2、数据变更了，我们怎么告诉render()函数？

那么很自然的，可以联想到有没有时机能够进行这么个处理，即： 1、既然模板渲染需要用到某个数据，那么一定会对这个数据进行访问，所以只要拦截getter，就有时机做出处理 2、在值变更的时候，也有setter可供拦截，那么拦截setter，也就能做出下一步动作。

所以在getter里，我们进行依赖收集（所谓依赖，就是这个组件所需要依赖到的数据），当依赖的数据被设置时，setter能获得这个通知，从而告诉render()函数进行重新计算。

#### 三、依赖收集与观察者模式
我们会发现，上述vue依赖收集的场景，正是一种一对多的方式（一个数据变更了，多个用到这个数据的地方要能够做出处理），而且，依赖的数据变更了，就一定要做出处理，所以观察者模式天然适用于解决依赖收集的问题。

那么，在Vue依赖收集里：谁是观察者？谁是观察目标？ 显然： **依赖的数据是观察目标，视图、计算属性、侦听器这些是观察者**

和文章开头里观察者模式实现代码相对应的，做出notify动作可以在setter里进行，做出addObserver()动作，则可以在getter里进行。

#### 四、从源码解析Vue的依赖收集
下面开始我们的源码解析之旅吧。这里主要阅读的是Vue2早期commit的版本，源码比较精简，适合用来掌握精髓。

##### 1、角色
Vue源码中实现依赖收集，实现了三个类： 
- Dep：**扮演观察目标的角色，每一个数据都会有Dep类实例**，它内部有个subs队列，subs就是subscribers的意思，**保存着依赖本数据的观察者**，当本数据变更时，调用dep.notify()通知观察者 
- Watcher：扮演观察者的角色，进行观察者函数的包装处理。如render()函数，会被进行包装成一个Watcher实例 
- Observer：辅助的可观测类，数组/对象通过它的转化，可成为可观测数据

##### 2、每一个数据都有的Dep类实例

**Dep类实例依附于每个数据而出来，用来管理依赖数据的Watcher类实例**
```js
let uid = 0; 
class Dep {
    static target = null;  // 巧妙的设计！
    constructor() {
        this.id = uid++;
        this.subs = [];
    }
    addSub(sub) {
        this.subs.push(sub);
    }
    removeSub(sub) {
        this.subs.$remove(sub);
    }
    depend() {
        Dep.target.addDep(this);
    }
    notify() {
        const subs = this.subs.slice();
        for (let i = 0, l = subs.length; i < l; i++) {
            subs[i].update();
        }
    }
}
```

由于JavaScript是单线程模型，所以虽然有多个观察者函数，但是一个时刻内，就只会有一个观察者函数在执行，那么此刻正在执行的那个观察者函数，所对应的Watcher实例，便会被赋给Dep.target这一类变量，从而只要访问Dep.target就能知道当前的观察者是谁。 在后续的依赖收集工作里，getter里会调用dep.depend()，而setter里则会调用dep.notify()

##### 3、配置数据观测
上面我们说每一个数据都会有一个Dep类的实例，具体是什么意思呢？在讲解数据观测之前，我们先给个具体的例子，表明处理前后的变化，如下所示的对象（即为options.data）：
``` js
{
    a: 1,
    b: [2, 3, 4],
    c: {
        d: 5
    }
}
```

在配置完数据观测后，会变成这样子：
```js
{
    __ob__, // Observer类的实例，里面保存着Dep实例__ob__.dep => dep(uid:0)
    a: 1,   // 在闭包里存在dep(uid:1)
    b: [2, 3, 4], // 在闭包里存在着dep(uid:2)，还有b.__ob__.dep => dep(uid:4)
    c: {
        __ob__, // Observer类的实例，里面保存着Dep实例__ob__.dep => dep(uid:5)
        d: 5 // 在闭包里存在着dep(uid:6)
    }
}
```

我们会发现，新角色Observer类登场啦，要说这个Observer类，那还得从生产每个组件的Component类的构造函数说起，在Component类的构造函数里，会进行一个组件实例化前的一系列动作，其中与依赖收集相关的源码如下：
```js
this._ob = observe(options.data)
    this._watchers = []
    this._watcher = new Watcher(this, render, this._update)
    this._update(this._watcher.value)
```

看到没有啊，observe(options.data)，咦？不对，不是说好的Observer吗？怎么是小写的observe？~~怕不是拼夕夕上买的对象？~~ 别急，我们首先来看一下observe函数里做了什么事情：
```js
function observe (value, vm) {
    if (!value || typeof value !== 'object') {
        return
    }
    var ob
    if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
        ob = value.__ob__
    } else if (shouldConvert && (isArray(value) || isPlainObject(value)) && Object.isExtensible(value) && !value._isVue) {
        ob = new Observer(value)
    }
    if (ob && vm) {
        ob.addVm(vm)
    }
    return ob
}
```
总结来说就是： 只为对象/数组 实例一个Observer类的实例，而且就只会实例化一次，并且需要数据是可配置的时候才会实例化Observer类实例。 那么，Observer类又干嘛了呢？且看以下源码：

```js
class Observer {
    constructor(value) {
        this.value = value
        this.dep = new Dep()
        def(value, '__ob__', this)
        if (isArray(value)) {
            var augment = hasProto
              ? protoAugment
              : copyAugment
            augment(value, arrayMethods, arrayKeys)
            this.observeArray(value)
        } else {
            this.walk(value)
        }
    }
    walk(obj) {
        var keys = Object.keys(obj)
        for (var i = 0, l = keys.length; i < l; i++) {
            this.convert(keys[i], obj[keys[i]])
        }
    }
    observeArray(items) {
        // 对数组每个元素进行处理
        // 主要是处理数组元素中还有数组的情况
        for (var i = 0, l = items.length; i < l; i++) {
            observe(items[i])
        }
    }
    convert(key, val) {
        defineReactive(this.value, key, val)
    }
    addVm(vm) {
        (this.vms || (this.vms = [])).push(vm)
    }
    removeVm(vm) {
        this.vms.$remove(vm)
    }
}
```
总结起来，就是： 
- 将Observer类的实例挂载在__ob__属性上，提供后续观测数据使用，以及避免被重复实例化。然后，实例化Dep类实例，并且将对象/数组作为value属性保存下来 
- 如果value是个对象，就执行walk()过程，遍历对象把每一项数据都变为可观测数据（调用defineReactive方法处理） 
- 如果value是个数组，就执行observeArray()过程，**递归地对数组元素调用observe()**，以便能够对元素还是数组的情况进行处理

##### 4、如何观测数组？
访问对象属性，其取值与赋值操作，都能被Object.defineProperty()成功拦截，但是Object.defineProperty()在处理数组上却存在一些问题，下面我们通过例子来了解一下：
```js
const data = {
    arr: [1, 2, 3]
}

function defineReactive(obj, key, val) {
    const property = Object.getOwnPropertyDescriptor(obj, key);
    if (property && property.configurable === false) {
        return;
    }
    const getter = property && property.get;
    const setter = property && property.set;
    Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        get() {
            console.log('取值过程被拦截了');
            const value = getter ? getter.call(obj) : val;
            return value;
        },
        set(newval) {
            console.log(`新的值是${newval}`)
            if (setter) {
                setter.call(obj, newval);
            } else {
                val = newval;
            }
        }
    })
}

defineReactive(data, 'arr', data.arr);
```

然后，我们进行一组测试，其结果如下：

```js
data.arr; // 取值过程被拦截了
data.arr[0] = 1;  // 取值过程被拦截了
data.arr.push(4); // 取值过程被拦截了
data.arr.pop(); // 取值过程被拦截了
data.arr.shift(); // 取值过程被拦截了
data.arr.unshift(5); // 取值过程被拦截了
data.arr.splice(0, 1); // 取值过程被拦截了
data.arr.sort((a, b) => a - b); // 取值过程被拦截了
data.arr.reverse(); // 取值过程被拦截了
data.arr = [4, 5, 6] // 新的值是4,5,6
```
可见，除了对arr重新赋值一个数组外，其他的操作都不会被setter检测到。所以为了能检测到数组的变更操作，在传入的数据项是一个数组时，Vue会进行以下处理：

```js
var augment = hasProto
  ? protoAugment
  : copyAugment
augment(value, arrayMethods, arrayKeys)
this.observeArray(value)
```

也就是对先对数组进行一个增强操作，这个增强操作呢，实际上是在数组的原型链上定义一系列操作方法，以此实现数组变更的检测，即定义一组原型方法在 arr.__proto__ 指向的那个原型对象上，如果浏览器不支持__proto__，那么就直接挂载在数组对象本身上），最后再进行数组项的观测操作。 那么，增强操作又是怎么做到检测数组变更的呢？，那么就需要用到AOP的思想了，即保留原来操作的基础上，植入我们的特定的操作代码。 一个例子如下：
```js
const arrayMethods = Object.create(Array.prototype); 
// 形成：arrayMethods.__proto__ -> Array.prototype
const originalPush = arrayMethods.push;
Object.defineProperty(arrayMethods, 'push', {
    configurable: true,
    enumerable: false,
    writable: true,
    value(...args) {
        const result = originalPush.apply(this, args);
        console.log('对数组进行了push操作，加入了值：', args);
        return result;
    }
})
data.arr.__proto__ = arrayMethods
data.arr.push([5, 6], 7) // 对数组进行了push操作，加入了值：[5, 6], 7
```
所以，只要对每一个数组操作方法进行这么一个处理，那么我们也就有办法在数组变更时，通知观察者了。Vue具体的实现如下：
```js
;[
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]
.forEach(function (method) {
  var original = arrayProto[method]
  def(arrayMethods, method, function mutator () {
    var i = arguments.length
    var args = new Array(i)
    while (i--) {
      args[i] = arguments[i]
    }
    var result = original.apply(this, args)
    var ob = this.__ob__
    var inserted
    switch (method) {
      case 'push':
        inserted = args
        break
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    if (inserted) ob.observeArray(inserted)
    ob.dep.notify()
    return result
  })
})
```
思路仍然是一样的： 
- 保留数组原来的操作 - push、unshift、splice这些方法，会带来新的数据元素，而新带来的数据元素，我们是有办法得知的（即为传入的参数） 
- 那么新增的元素也是需要被配置为可观测数据的，这样子后续数据的变更才能得以处理。所以要对新增的元素调用observer实例上的observeArray方法进行一遍观测处理 
- 由于数组变更了，那么就需要通知观察者，所以通过ob.dep.notify()对数组的观察者watchers进行通知

##### 5、Watcher
Watcher扮演的角色是**观察者**，它关心数据，在数据变化后能够获得通知，并作出处理。一个组件里可以有多个Watcher类实例，Watcher类包装观察者函数，而观察者函数使用数据。 观察者函数经过Watcher是这么被包装的： 
- 模板渲染：this._watcher = new Watcher(this, render, this._update) 
- 计算属性
```js
computed: {
    name() {
        return `${this.firstName} ${this.lastName}`;
    }
}
/*
会形成
new Watcher(this, function name() {
    return `${this.firstName} ${this.lastName}`
}, callback);
*/
```

在Watcher类里做的事情，概括起来则是：

1、传入组件实例、观察者函数、回调函数、选项，然后我们先解释清楚4个变量：deps、depIds、newDeps、newDepIds，它们的作用如下： 
- deps：缓存上一轮执行观察者函数用到的dep实例 
- depIds：Hash表，用于快速查找 
- newDeps：存储本轮执行观察者函数用到的dep实例 
- newDepIds：Hash表，用于快速查找


2、进行初始求值，初始求值时，会调用watcher.get()方法

3、watcher.get()会做以下处理：初始准备工作、调用观察者函数计算、事后清理工作

4、在初始准备工作里，会将当前Watcher实例赋给Dep.target，清空数组newDeps、newDepIds

5、执行观察者函数，进行计算。由于数据观测阶段执行了defineReactive()，所以计算过程用到的数据会得以访问，从而触发数据的getter，从而执行watcher.addDep()方法，将特定的数据记为依赖

6、对每个数据执行watcher.addDep(dep)后，数据对应的dep如果在newDeps里不存在，就会加入到newDeps里，这是因为一次计算过程数据有可能被多次使用，但是同样的依赖只能收集一次。并且如果在deps不存在，表示上一轮计算中，当前watcher未依赖过某个数据，那个数据相应的dep.subs里也不存在当前watcher，所以要将当前watcher加入到数据的dep.subs里 

7、进行事后清理工作，首先释放Dep.target，然后拿newDeps和deps进行对比，接着进行以下的处理： 
- newDeps里不存在，deps里存在的数据，表示是过期的缓存数据。相应的，从数据对应的dep.subs移除掉当前watcher
- 将newDeps赋给deps，表示缓存本轮的计算结果，这样子下轮计算如果再依赖同一个数据，就不需要再收集了

8、当某个数据更新时，由于进行了setter拦截，所以会对该数据的dep.subs这一观察者队列里的watchers进行通知，从而执行watcher.update()方法，而update()方法会重复求值过程（即为步骤3-7），从而使得观察者函数重新计算，而render()这种观察者函数重新计算的结果，就使得视图同步了最新的数据

###### 6、defineReative
我们都知道，Vue实现数据劫持使用的是Object.defineProperty()，而使用Object.defineProperty()来拦截数据的操作，都封装在了defineReactive里。接下来，我们来解析下defineReactive()源码：

```js
function defineReactive (obj, key, val) {
    var dep = new Dep()
    var property = Object.getOwnPropertyDescriptor(obj, key)
    if (property && property.configurable === false) {
        return
    }
    var getter = property && property.get
    var setter = property && property.set

    var childOb = observe(val)
    Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        get: function reactiveGetter () {
            var value = getter ? getter.call(obj) : val
            if (Dep.target) {
                dep.depend()
                if (childOb) {
                    childOb.dep.depend()
                }
                if (isArray(value)) {
                    for (var e, i = 0, l = value.length; i < l; i++) {
                        e = value[i]
                        e && e.__ob__ && e.__ob__.dep.depend()
                    }
                }
            }
            return value
        },
        set: function reactiveSetter (newVal) {
            var value = getter ? getter.call(obj) : val
            if (newVal === value) {
                return
            }
            if (setter) {
                setter.call(obj, newVal)
            } else {
                val = newVal
            }
            childOb = observe(newVal)
            dep.notify()
        }
    })
}
```
1、闭包的妙用：上述代码里Object.defineProperty()里的get/set方法相对于var dep = new Dep()形成了闭包，从而很巧妙地保存了dep实例(dep被保存了，dep是父函数上下文里的变量) 2、getter里进行的是**依赖的收集工作**。如果某个观察者函数访问了某个数据，我们就可以把这个观察者函数认为是依赖这个数据的，所以举个具体的例子：data.a，在以下地方被使用：
```html
<template>
    <div>{{a}}</div>
</template>
```
``` js
computed: {
    newValue() {
        return this.a + 1;
    }
}
```
那么，template被编译后，会形成AST，在执行render()函数过程中就会触发data.a的getter，并且这个过程是惰性收集的（如newValue虽然用到 了a，但如果它没有被调用执行，就不会触发getter，也就不会被添加到data.a的dep.subs里） 现在，假设template变成了这样子：
```html
<template>
    <div>I am {{a}}，plus 1 is {{newValue}}</div>
</template>
```
那么，可以看到就对应了两个观察者函数：计算属性newValue和render()函数，它们会被包装为两个watcher。 在执行render()函数渲染的过程中，访问了data.a，从而使得data.a的dep.subs里加入了render@watcher 又访问了计算属性newValue，计算属性里访问了data.a，使得data.a的dep.subs里加入了newValue@watcher。所以data.a的dep.subs里就有了[render@watcher, newValue@watcher]

为什么访问特定数据就使能让数据的deps.subs里加入了watcher呢？

这是因为，在访问getter之前，就已经进入了某个watcher的上下文了，所以有一件事情是可以保证的：Watcher类的实例watcher已经准备好了，并且已经调用了watcher.get()，Dep.target是有值的

所以，我们看到getter里进行依赖收集的写法是dep.depend()，并没有传入什么参数，这是因为，我们只需要把Dep.target加入当前dep.subs里就好了。 但是我们又发现，Dep.prototype.depend()的实现是：
```js
Dep.prototype.depend = function {
    Dep.target.addDep(this);
}
```

为什么depend()的时候，不直接把Dep.target加入dep.subs，而是调用了Dep.target.addDep呢？ 这是因为，我们不能无脑地直接把当前watcher塞入dep.subs里，我们要保证dep.subs里的每个watcher都是唯一的。 Dep.target是Watcher类实例，调用dep.depend()相当于调用了watcher.addDep方法，所以我们再来看一下这个方法里做了什么事情：
```js
Watcher.prototype.addDep = function (dep) {
    var id = dep.id
    if (!this.newDepIds[id]) {
        this.newDepIds[id] = true
        this.newDeps.push(dep)
        if (!this.depIds[id]) {
            dep.addSub(this)
        }
    }
}
```
概括起来就是：判断本轮计算中是否收集过这个依赖，收集过就不再收集，没有收集过就加入newDeps。同时，判断有无缓存过依赖，缓存过就不再加入到dep.subs里了。

3、setter里进行的，则是在值变更后，通知watcher进行重新计算。由于setter能访问到闭包中dep，所以就能获得dep.subs，从而知道有哪些watcher依赖于当前数据，如果自己的值变化了，通过调用dep.notify()，来遍历dep.subs里的watcher，执行每个watcher的update()方法，让每个watcher进行重新计算。

##### 7、困惑点解析
回到开头的例子，我们说举例的option.data被观测之后，变成了：
```js
{
    __ob__, // dep(uid:0)
    a: 1, // dep(uid:1)
    b: [2, 3, 4], // dep(uid:2), b.__ob__.dep(uid:3)
    c: {
        __ob__, // dep(uid:4), c.__ob__.dep(uid:5)
        d: 5 // dep(uid:6)
    }
}
```
我们不禁好奇，为什么对于数组和对象，配置依赖观测后，会实例化两个Dep类实例呢？ 这是因为：数组和对象，都是引用类型数据，对于引用类型数据，存在两种操作：改变引用和改变内容，即为：
```js
data.b = [4, 5, 6]; // 改变引用
data.b.push(7); // 改变内容
```

而其实，改变引用这种情况，我们前面在说到Object.defineProperty()的限制时说过，是可以被检测到的，所以闭包里的dep可以收集这种依赖。而改变内容，却没办法通过Object.defineProperty()检测到，所以对数组变异操作进行了封装，所以就需要在数组上挂在__ob__属性，在__ob__上挂载dep实例，用来处理改变内容的情况，以便能够形成追踪链路。

#### 三、总结
总结而言，Vue的依赖收集，是观察者模式的一种应用。其原理总结如图：
![https://pic4.zhimg.com/80/v2-22c29a1c5ab746ad942e0c02417b05db_hd.jpg](https://pic4.zhimg.com/80/v2-22c29a1c5ab746ad942e0c02417b05db_hd.jpg)

##### 1、配置依赖观测
![https://pic2.zhimg.com/80/v2-8b0bb8bc216cb96ae46c21ba190aceb5_hd.jpg](https://pic2.zhimg.com/80/v2-8b0bb8bc216cb96ae46c21ba190aceb5_hd.jpg)

##### 2、收集依赖
![https://pic4.zhimg.com/80/v2-e0608a870de75fcf3abccbd5af8ffcc7_hd.jpg](https://pic4.zhimg.com/80/v2-e0608a870de75fcf3abccbd5af8ffcc7_hd.jpg)

##### 3、数据值变更

![https://pic1.zhimg.com/80/v2-13f90743f55bfaf6d427c192451bc070_hd.jpg](https://pic1.zhimg.com/80/v2-13f90743f55bfaf6d427c192451bc070_hd.jpg)

[Vue 依赖收集原理分析（这个也要看看）](https://www.jianshu.com/p/e6e1fa824849)

[源码阅读：Vue的响应式原理（一）](https://www.jianshu.com/p/b329966438ca?utm_campaign=maleskine&utm_content=note&utm_medium=seo_notes&utm_source=recommendation)

## vuex
[vuex工作原理详解](https://www.jianshu.com/p/d95a7b8afa06)
## mixin
#### 同名选项合并
* 数据（data）合并，==组件数据优先==
* 值为对象的选项，例如 methods, components 和 directives，将被混合为同一个对象。两个对象键名冲突时，==取组件对象的键值对==。
* 同名钩子函数将混合为一个数组，因此都将被调用。另外==，混入对象的钩子将在组件自身钩子之前调用，所以组件钩子可以重写混入钩子，即组件钩子拥有最终发言权==

## vue路由原理
[前端路由简介以及vue-router实现原理](https://segmentfault.com/a/1190000015123061/)

更新视图但不重新请求页面，是前端路由原理的核心之一，目前在浏览器环境中这一功能的实现主要有2种方式：
* 利用URL中的hash("#");
* 利用History interface在HTML5中新增的方法;
### HashHistory
hash("#")符号的本来作用是加在URL指示网页中的位置：
`http://www.example.com/index.html#print`

#本身以及它后面的字符称之为hash可通过window.location.hash属性读取.

* hash虽然出现在url中，但不会被包括在http请求中，它是用来指导浏览器动作的，对服务器端完全无用，因此，改变hash不会重新加载页面。
* 可以为hash的改变添加监听事件：`window.addEventListener("hashchange",funcRef,false)`
* 每一次改变hash(window.location.hash)，都会在浏览器访问历史中增加一个记录。
两个方法：HashHistory.push() 和 HashHistory.replace().
利用hash的以上特点，就可以来实现前端路由"更新视图但不重新请求页面"的功能了。
```js
1 $router.push() //调用方法

2 HashHistory.push() //根据hash模式调用,设置hash并添加到浏览器历史记录（添加到栈顶）（window.location.hash= XXX）

3 History.transitionTo() //监测更新('hashchange')，更新则调用History.updateRoute()

4 History.updateRoute() //更新路由

5 {app._route= route} //替换当前app路由

6 vm.render() //更新视图

```
### HTML5History
History interface是浏览器历史记录栈提供的接口，通过back(),forward(),go()等方法，我们可以读取浏览器历史记录栈的信息，进行各种跳转操作。

从HTML5开始，History interface提供了2个新的方法：pushState(),replaceState()使得我们可以对浏览器历史记录栈进行修改：
```js
window.history.pushState(stateObject,title,url)
window.history.replaceState(stateObject,title,url)
// stateObject:当浏览器跳转到新的状态时，将触发popState事件，该事件将携带这个stateObject参数的副本
// title:所添加记录的标题
// url:所添加记录的url
```
```js
1 $router.push() //调用方法

2 HashHistory.push() //根据hash模式调用,设置hash并添加到浏览器历史记录（添加到栈顶）（window.location.hash= XXX）

3 History.transitionTo() //监测更新('popState')，更新则调用History.updateRoute()

4 History.updateRoute() //更新路由

5 {app._route= route} //替换当前app路由

6 vm.render() //更新视图
```
这2个方法有个共同的特点：当调用他们修改浏览器历史栈后，虽然当前url改变了，但浏览器不会立即发送请求该url，这就为单页应用前端路由，更新视图但不重新请求页面提供了基础

### 两种模式的比较
一般的需求场景中，hash模式与history模式是差不多的，根据MDN的介绍，调用history.pushState()相比于直接修改hash主要有以下优势：
* pushState设置的新url可以是与当前url同源的任意url,而hash只可修改#后面的部分，故只可设置与当前同文档的url
* pushState设置的新url可以与当前url一模一样，这样也会把记录添加到栈中，而hash设置的新值必须与原来不一样才会触发记录添加到栈中
* pushState通过stateObject可以添加任意类型的数据记录中，而hash只可添加短字符串
* pushState可额外设置title属性供后续使用

##### history模式的问题
对于单页应用来说，理想的使用场景是仅在进入应用时加载index.html，后续在的网络操作通过ajax完成，不会根据url重新请求页面，但是如果用户直接在地址栏中输入并回车，浏览器重启重新加载等特殊情况。

hash模式仅改变hash部分的内容，而hash部分是不会包含在http请求中的(hash带#)：
`http://oursite.com/#/user/id //如请求，只会发送http://oursite.com/`

所以hash模式下遇到根据url请求页面不会有问题

而history模式则将url修改的就和正常请求后端的url一样(history不带#)
```js
http://oursite.com/user/id
```
如果这种向后端发送请求的话，后端没有配置对应/user/id的get路由处理,会返回404错误。

官方推荐的解决办法是在服务端增加一个覆盖所有情况的候选资源：如果 URL 匹配不到任何静态资源，则应该返回同一个 index.html 页面，这个页面就是你 app 依赖的页面。同时这么做以后，服务器就不再返回 404 错误页面，因为对于所有路径都会返回 index.html 文件。为了避免这种情况，在 Vue 应用里面覆盖所有的路由情况，然后在给出一个 404 页面。或者，如果是用 Node.js 作后台，可以使用服务端的路由来匹配 URL，当没有匹配到路由的时候返回 404，从而实现 fallback。

## 虚拟Dom
[vue的Virtual Dom实现- snabbdom解密](https://www.cnblogs.com/xuntu/p/6800547.html)
## 虚拟Dom diff算法
[深入Vue2.x的虚拟DOM diff原理](https://blog.csdn.net/m6i37jk/article/details/78140159)

[解析vue2.0的diff算法](https://segmentfault.com/a/1190000008782928)

[VirtualDOM与diff(Vue实现)](https://zhuanlan.zhihu.com/p/29450092)

[虚拟DOM Diff算法解析](https://zhuanlan.zhihu.com/p/38638779)
[让虚拟DOM和DOM-diff不再成为你的绊脚石](https://juejin.im/post/5c8e5e4951882545c109ae9c)
#### 虚拟DOM+diff为什么快?
（1）真实DOM的创建需要完成默认样式，挂载相应的属性，注册相应的Event Listener ...效率是很低的。如果元素比较多的时候，还涉及到嵌套，那么元素的属性和方法等等就会很多，效率更低。  diff算法对DOM进行原地复用，减少DOM创建性能耗费

（2）虚拟DOM很轻量，对虚拟DOM操作快

（3）==页面的排版与重绘==也是一个相当耗费性能的过程。通过对虚拟DOM进行diff，逐步找到更新前后vdom的差异，然后将差异反应到DOM树上（也就是patch）减少过多DOM节点排版与重绘损耗。特别要提一下Vue的patch是即时的，并不是打包所有修改最后一起操作DOM（React则是将更新放入队列后集中处理），朋友们会问这样做性能很差吧？实际上现代浏览器对这样的DOM操作做了优化，并太大差别。

#### 原理分析
当页面的数据发生变化时，Diff算法只会比较同一层级的节点：

如果节点类型不同，直接干掉前面的节点，再创建并插入新的节点，不会再比较这个节点以后的子节点了。

如果节点类型相同，则会重新设置该节点的属性，从而实现节点的更新。

-------------------------------------------

众所周知，Vue 通过数据绑定来修改视图，当某个数据被修改的时候，

set 方法会让闭包中的 Dep 调用 notify 通知所有订阅者 Watcher，Watcher 通过 get 方法执行 vm.\_update(vm.\_render(), hydrating)。

update 方法的第一个参数是一个 VNode 对象，在内部会将该 VNode 对象与之前旧的 VNode 对象进行__patch__。

patch 将新老 VNode 节点进行比对，然后将根据两者的比较结果进行最小单位地修改视图，

而不是将整个视图根据新的 VNode 重绘。patch 的核心在于 diff 算法，这套算法可以高效地比较 viturl dom 的变更，得出变化以修改视图。

#### patch如何工作的呢？
##### patch的核心diff算法
diff算法是通过同层的树节点进行比较而非对树进行逐层搜索遍历的方式，所以时间复杂度只有O(n)，是一种相当高效的算法。

![image](https://pic1.zhimg.com/80/v2-78ed0f7a71736796f0d4c31f5a9d1b9c_hd.jpg)

是同一个节点的时候直接修改现有的节点,不是同一层的话就是创建新的DOM，移除旧的DOM。

当两个VNode的tag、key、isComment都相同，并且同时定义或未定义data的时候，且如果标签为input则type必须相同。这时候这两个VNode则算sameVnode，**可以直接进行patchVnode操作**。

##### patchVnode的规则是这样的：



1.如果新旧VNode都是静态的，同时它们的key相同（代表同一节点），并且新的VNode是clone或者是标记了once（标记v-once属性，只渲染一次），那么只需要替换elm以及componentInstance即可。



2.新老节点均有children子节点，则对子节点进行diff操作，调用updateChildren，这个updateChildren也是diff的核心。



3.如果老节点没有子节点而新节点存在子节点，先清空老节点DOM的文本内容，然后为当前DOM节点加入子节点。



4.当新节点没有子节点而老节点有子节点的时候，则移除该DOM节点的所有子节点。



5.当新老节点都无子节点的时候，只是文本的替换。


## 虚拟Dom diff算法（2）
[知乎](https://www.zhihu.com/question/29504639)
###  Diff算法实现
**1. 步骤一：用JS对象模拟DOM树：通过记录DOM的节点类型、属性，还有子节点，创建一个包含以上信息的javascript Dom对象（createElement方法）**.
```js
function Element (tagName, props, children) {
  this.tagName = tagName
  this.props = props
  this.children = children
}

module.exports = function (tagName, props, children) {
  return new Element(tagName, props, children)
}
```

**2.步骤二： 比较两棵虚拟DOM树的差异**


2.1. Virtual DOM 只会对同一个层级的元素进行对比。第一层的元素只会和第一层级的元素对比，第二层级的只会跟第二层级对比。这样算法复杂度就可以达到 O(n)。

2.2  深度优先遍历，记录差异
    
在实际的代码中，会对新旧两棵树进行一个深度优先的遍历，==这样每个节点都会有一个唯一的标记==.在深度优先遍历的时候，每遍历到一个节点就把该节点和新的的树进行对比。如果有差异的话就==记录到一个对象里面==。

```javascript
    // diff 函数，对比两棵树
    function diff (oldTree, newTree) {
      var index = 0 // 当前节点的标志
      var patches = {} // 用来记录每个节点差异的对象
      dfsWalk(oldTree, newTree, index, patches)
      return patches
    }
    
    // 对两棵树进行深度优先遍历
    function dfsWalk (oldNode, newNode, index, patches) {
      // 对比oldNode和newNode的不同，记录下来
      patches[index] = [...]
    
      diffChildren(oldNode.children, newNode.children, index, patches)
    }
    
    // 遍历子节点
    function diffChildren (oldChildren, newChildren, index, patches) {
      var leftNode = null
      var currentNodeIndex = index
      oldChildren.forEach(function (child, i) {
        var newChild = newChildren[i]
        currentNodeIndex = (leftNode && leftNode.count) // 计算节点的标识
          ? currentNodeIndex + leftNode.count + 1
          : currentNodeIndex + 1
        dfsWalk(child, newChild, currentNodeIndex, patches) // 深度遍历子节点
        leftNode = child
      })
    }
```
例如，上面的div和新的div有差异，当前的标记是0，那么：
```js
    patches[0] = [{difference}, {difference}, ...] // 用数组存储新旧节点的不同
    
```
2.3 差异类型

以上所说的别标记的差异指的是：
* 替换掉原来的节点，例如元素类型不一样；
    * 判断新旧节点的tagName和是不是一样的，如果不一样的说明需要替换掉。
* 移动、删除、新增子节点，例如子节点顺序发生变化。
    * 实际上是不需要替换节点，而只需要经过节点移动就可以达到，我们使用了列表对比算法
    * 列表对比算法
* 修改了节点的属性
* 对于文本节点，文本内容可能会改变。

**3.步骤三：把差异应用到真正的DOM树上**

因为步骤一所构建的 JavaScript 对象树和render出来真正的DOM树的信息、结构是一样的。所以我们可以对那棵DOM树也进行深度优先的遍历，遍历的时候从步骤二生成的patches对象中找出当前遍历的节点差异，然后进行 DOM 操作（使用patch方法打补丁）。
```js
function patch (node, patches) {
  var walker = {index: 0}
  dfsWalk(node, walker, patches)
}

function dfsWalk (node, walker, patches) {
  var currentPatches = patches[walker.index] // 从patches拿出当前节点的差异

  var len = node.childNodes
    ? node.childNodes.length
    : 0
  for (var i = 0; i < len; i++) { // 深度遍历子节点
    var child = node.childNodes[i]
    walker.index++
    dfsWalk(child, walker, patches)
  }

  if (currentPatches) {
    applyPatches(node, currentPatches) // 对当前节点进行DOM操作
  }
}
```
applyPatches，根据不同类型的差异对当前节点进行 DOM 操作：
```js
function applyPatches (node, currentPatches) {
  currentPatches.forEach(function (currentPatch) {
    switch (currentPatch.type) {
      case REPLACE:
        node.parentNode.replaceChild(currentPatch.node.render(), node)
        break
      case REORDER:
        reorderChildren(node, currentPatch.moves)
        break
      case PROPS:
        setProps(node, currentPatch.props)
        break
      case TEXT:
        node.textContent = currentPatch.content
        break
      default:
        throw new Error('Unknown patch type ' + currentPatch.type)
    }
  })
}
```
4.总结
```js
// 1. 构建虚拟DOM
var tree = el('div', {'id': 'container'}, [
    el('h1', {style: 'color: blue'}, ['simple virtal dom']),
    el('p', ['Hello, virtual-dom']),
    el('ul', [el('li')])
])

// 2. 通过虚拟DOM构建真正的DOM
var root = tree.render()
document.body.appendChild(root)

// 3. 生成新的虚拟DOM
var newTree = el('div', {'id': 'container'}, [
    el('h1', {style: 'color: red'}, ['simple virtal dom']),
    el('p', ['Hello, virtual-dom']),
    el('ul', [el('li'), el('li')])
])

// 4. 比较两棵虚拟DOM树的不同
var patches = diff(tree, newTree)

// 5. 在真正的DOM元素上应用变更
patch(root, patches)
```

即：
1. 初始渲染时，首先将数据渲染为 Virtual DOM，然后由 Virtual DOM 生成 DOM。
2. 数据更新时，渲染得到新的 Virtual DOM
4. 比较两棵虚拟DOM树的不同
   * 深度优先遍历，创建节点标记，记录差异到patches数组
5. 在真正的DOM元素上应用变更
   * patches数组中找出当前遍历的节点差异，然后进行 DOM 操作（使用patch方法打补丁）。
   * patch方法里进行了applyPatches，根据不同类型的差异对当前节点进行 DOM 操作。

## v-for中key的作用
[Vue2.0 v-for 中 :key 到底有什么用？](https://www.cnblogs.com/zhumingzhenhao/p/7688336.html)

其实不只是vue，react中在执行列表渲染时也会要求给每个组件添加上key这个属性。

要解释key的作用，不得不先介绍一下虚拟DOM的Diff算法了。

我们知道，vue和react都实现了一套虚拟DOM，使我们可以不直接操作DOM元素，只操作数据便可以重新渲染页面。而隐藏在背后的原理便是其高效的Diff算法。

vue和react的虚拟DOM的Diff算法大致相同，其核心是基于两个简单的假设：

1. 两个相同的组件产生类似的DOM结构，不同的组件产生不同的DOM结构。

2. 同一层级的一组节点，他们可以通过唯一的id进行区分。

基于以上这两点假设，使得虚拟DOM的Diff算法的复杂度从O(n^3)降到了O(n)。

这里我们借用React’s diff algorithm中的一张图来简单说明一下：

![image](https://images2017.cnblogs.com/blog/1170024/201710/1170024-20171018191016162-1229549117.png)

当页面的数据发生变化时，Diff算法只会比较同一层级的节点：

如果节点类型不同，直接干掉前面的节点，再创建并插入新的节点，不会再比较这个节点以后的子节点了。

如果节点类型相同，则会重新设置该节点的属性，从而实现节点的更新。

当某一层有很多相同的节点时，也就是列表节点时，Diff算法的更新过程默认情况下也是遵循以上原则。

比如一下这个情况

![image](https://images2017.cnblogs.com/blog/1170024/201710/1170024-20171018191056146-436654927.png)

我们希望可以在B和C之间加一个F，Diff算法默认执行起来是这样的：

![image](https://images2017.cnblogs.com/blog/1170024/201710/1170024-20171018191119318-368188268.png)

即把C更新成F，D更新成C，E更新成D，最后再插入E，是不是很没有效率？

所以我们需要使用key来给每个节点做一个唯一标识，Diff算法就可以正确的识别此节点，找到正确的位置区插入新的节点。

![image](https://images2017.cnblogs.com/blog/1170024/201710/1170024-20171018191142334-13876328.png)

所以一句话，key的作用主要是为了高效的更新虚拟DOM。另外vue中在使用相同标签名元素的过渡切换时，也会使用到key属性，其目的也是为了让vue可以区分它们，

否则vue只会替换其内部属性而不会触发过渡效果。

## 生命周期
![image](https://note.youdao.com/favicon.icohttps://upload-images.jianshu.io/upload_images/12602393-5310c1449192165f.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1000/format/webp)

![image](https://upload-images.jianshu.io/upload_images/12602393-1bd8cb609ed7521a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/690/format/webp)

#### 详解
* beforeCreate:实例初始化之后，this指向创建的实例，不能访问到data,computed,watch,methods上的数据和方法，该生命周期常用于初始化非响应式变量
* created:实例创建完成，可以访问到data,computed,watch,methods上的数据和方法，未挂载到DOM，不能访问到$el属性，$el属性内容为空数组；该生命周期常用于简单的ajax请求，页面的初始化。
* beforeMount:在挂载开始之前被调用，beforeMount之前，会找到对应的template,并编译成render函数
* mounted:实例挂载到DOM上，此时可以通过DOM API获取DOM节点，$ref属性可以访问。该生命周期常用于获取VNODE信息和操作，ajax请求。
* beforeUpdate:响应式数据更新时调用，发生在虚拟DOM打补丁之前。该生命周期适合在更新之前访问现有的DOM，比如手动移除已经添加的事件监听器。
* updated:虚拟DOM重新渲染和打补丁之后调用，组件DOM已经更新，可执行依赖于DOM的操作。避免在这个钩子函数中操作数据，可能陷入死循环。
* beforeDestroy:实例销毁之前调用。这一步，实例仍然完全可用，thi仍能获取到实例。该生命周期常用于销毁定时器、解绑全局事件、销毁插件对象等操作。
* destroyed:实例销毁后调用，调用后，Vue实例指示的所有东西都会被解绑，所有的事件监听器会被移除，所有的子实例也会被销毁
#### 运用：

* beforeCreate:在实例初始化之后，数据观测data observer(props、data、computed) 和 event/watcher 事件配置之前被调用。

* created:实例已经创建完成之后被调用。在这一步，实例已完成以下的配置：数据观测(data observer)，属性和方法的运算， watch/event 事件回调。然而，挂载阶段还没开始，$el 属性目前不可见。

* beforeMount:在挂载开始之前被调用：相关的 render 函数首次被调用。

* mounted: el 被新创建的 vm.$el 替换，并挂载到实例上去之后调用该钩子。

* beforeUpdate:数据更新时调用，发生在虚拟 DOM 重新渲染和打补丁之前。 你可以在这个钩子中进一步地更改状态，这不会触发附加的重渲染过程。

* updated：无论是组件本身的数据变更，还是从父组件接收到的 props 或者从vuex里面拿到的数据有变更，都会触发虚拟 DOM 重新渲染和打补丁，并在之后调用 updated。

* beforeDestroy:实例销毁之前调用。在这一步，实例仍然完全可用。

* destroyed:Vue 实例销毁后调用。调用后，Vue 实例指示的所有东西都会解绑定，所有的事件监听器会被移除，所有的子实例也会被销毁。 该钩子在服务器端渲染期间不被调用。

注意:
created阶段的ajax请求与mounted请求的区别：前者页面视图未出现，如果请求信息过多，页面会长时间处于白屏状态。

## vue3 proxy 解决了什么问题
* Object.defineProperty需要遍历所有的属性，这就造成了如果vue对象的data/computed/props中的数据规模庞大，那么遍历起来就会慢很多。
* 同样，如果vue对象的data/computed/props中的数据规模庞大，那么Object.defineProperty需要监听所有的属性的变化，那么占用内存就会很大。
* 无法监听es6的Set、WeakSet、Map、WeakMap的变化；
* 无法监听Class类型的数据；
* 属性的新加或者删除也无法监听；
* 数组元素的增加和删除也无法监听。
* 还有一点就是这个模块被耦合到了vue里面，新版本可以单独作为一个库来使用。

proxy实现的observer 还有以下特性:
* Proxy可以直接监听对象而非属性(Proxy直接可以劫持整个对象,并返回一个新对象)
* Proxy可以直接监听数组的变化

## nextTick
[Vue2.0源码阅读笔记（四）：nextTick](https://juejin.im/post/5cd90cd5518825695f30d2b3?utm_source=gold_browser_extension)

[全面解析Vue.nextTick实现原理](https://www.cnblogs.com/liuhao-web/p/8919623.html)（这个好）

## 虚拟DOM 
[vue核心之虚拟DOM(vdom)](https://www.jianshu.com/p/af0b398602bc)

## vue组件的is特性
组件功能是vue项目的一大特色。组件可以扩展html元素，可以封装可重用的代码，可以增加开发效率。它是自定义元素，vue.js的编译器为它添加特殊功能。有些情况，组件也可以是原生HTML元素的形式，以is特性进行扩展。

那么is特性究竟是什么呢？有什么用途呢？

其实简单的来说，因为vue模板就是dom模板，使用的是浏览器原生的解析器进行解析，所以dom模板的限制也就成为vue模板的限制了，要求vue模板是有效的HTML代码片段。但是由于dom的一些html元素对放入它里面的元素有限制，所以导致有些组件没办法放在一些标签中，比如<ul></ul>  <select></select><a></a> <table></table>等等这些标签中，所以需要增加is特性来扩展，从而达到可以在这些受限制的html元素中使用。例如：

``` html
<ul>
  <li is="my-component"></li>
</ul>

<!-- 而不能使用下面的方式，因为下面的方式会将自定义组件<my-component>当做无效的内容，导致错误的渲染结果 -->

<ul>
  <my-component></my-component>
<ul>
```
其实两种写法表达的意思是一致，但是第二种写法是不合法的，会导致错误。


## 垃圾回收机制

原理：找到不再被使用的变量，然后释放其占用的内存，但这个过程不是时时的，因为其开销比较大，

所以垃圾回收器会按照固定时间间隔周期性的执行

回收方式：

a.标记清除

当变量进入环境时，将这个变量标记为“进入环境”;当变量离开环境时，则将其标记为“离开环境”。

标记“离开环境”的就回收内存

b.引入计数(低级浏览器)

当变量声明，第一次赋值时记为1，然后当这个变量值改变时，记录为0，将计数为0的回收

内存泄露

a.意外的全局变量引起的内存泄露

原因: 全局变量不会被回收

解决：使用严格模式避免

b.闭包引起的

原因: 活动对象被引用，使闭包内的变量不会被释放

解决: 将活动对象赋值为null

c.被清理的DOM元素的引用

原因: 虽然DOM被删掉了，但对象中还存在对DOM的引用

解决: 将对象赋值为null


## vue中computed与methods的异同

区别：1、computed计算属性的方式在使用时时不用加(),而methods方式在使用时要像方法一样去用，必须加()；


2、在缓存上也大有不同，利用computed计算属性是将 content与message绑定，只有当message发生变化时才会触发content，而methods方式是每次进入页面都要执行该方法，但是在利用实时信息时，比如显示当前进入页面的时间，必须用methods方式


# vue依赖收集（双向绑定）原理
vue依赖收集的核心主要是使用Object.defineProperty()进行数据劫持。

vue在实例化组件的时候，需要一个初始化数据的生成函数，也就是组件中的data函数。Vue为data函数返回的对象中的每一个key(属性)都维护一个观察者的列表。

怎么给每个对象都维护一个观察者的列表呢？vue结合了观察者模式，在源码上我们可以看到三个重要的类：Observer,Dep,和watcher.

（为什么vue的依赖收集需要使用观察者模式呢？因为每个被依赖的数据更新的时候，有可能多个用到这个数据的地方要做出相应的处理。而观察者模式的思想正是这样，观察目标可以以一对多的方式通知观察者做出相应反应）


Observer：Vue会给每一个响应式的数据添加一个observer，数组/对象通过它的转化，可以成为可观测数据。

Dep：负责维护一个观察者列表（收集依赖），相当于观察者模式里的观察目标。当接收到Observer的通知时，他就通知所有watcher，让watcher进行更新动作。

Watcher：扮演观察者的角色，进行观察者函数的包装处理。如render()函数，计算属性，侦听器等，会被包装成一个Watcher实例。


## Dep
#### subs数组
我们先简单地说一下Dep这个类。Dep类实例依附于每个响应数据而来，用来管理依赖数据的Watcher类实例。Dep实例包含了一个subs数组，用来存放watcher实例。
#### id
Dep类会有一个自己的id。这个id是用来防止dep对应的数据被多次依赖而做的标识。

#### 静态属性target
Dep还有一个静态属性target。Dep.target 用来存放Watcher 类的实例。由于JavaScript是单线程模型，所以虽然有多个观察者函数，但是一个时刻内，就只会有一个观察者函数在执行，那么此刻正在执行的那个观察者函数，所对应的Watcher实例，便会被赋给Dep.target这个变量，从而只要访问Dep.target就能知道当前的观察者是谁。 

#### depend()
添加依赖，也就是把当前Dep.target添加到这个dep实例的subs数组中,也就是之前所说的观察者列表。

#### notify()
通知watcher，执行所有watcher的update()方法，更新watcher的数据
在后续的依赖收集工作里，在Observer类里getter里会调用dep.depend()，而setter里则会调用dep.notify()
<!-- 我们先从Observer类说起。Vue会给每一个响应式的数据添加一个observer，这个observer就负责观察这个数据有没有变化。 -->

## Observer
<!-- https://www.jianshu.com/p/b329966438ca?utm_campaign=maleskine&utm_content=note&utm_medium=seo_notes&utm_source=recommendation -->
Vue会给每一个响应式的数据添加一个observer，这个observer就负责观察这个数据有没有发生变化。
#### observe方法
在说Observer这个类之前，vue还有一个observe函数需要提一下。在vue的组件实例化前，会首先执行一次observe函数。这个函数的功能大体上是对象/数组 实例一个Observer类的实例，而且就只会实例化一次，并且需要数据是可配置的时候才会实例化Observer类实例。即在数据可配置的前提下，vue通过observe函数给对象添加了一个唯一的observer。(Vue是通过observe()函数来给对象添加observer的,在observeArray和defineReactive中对属性都调用了一遍observe()函数。)

Observer这个类有几个重要的东西。实例属性value和dep，walk方法，还有对数组数据进行处理的observeArray方法。
#### value
value在vue实例化的时候保存了被观察的对象，比如vue的根属性data。此时value属性指向data，而value的__ob__属性指向observer对象（__ob__是Observer类的实例，里面保存着Dep实例）；

#### dep
 每一个observer对象都有一个dep，保存着Dep类的一个实例，负责收集依赖和通知。

#### walk
walk源码上来看是对value，也就是vue实例的data对象属性进行遍历调用defineReactive()方法，把data对象中的属性都转化为getter/setter对。这时候我们牵涉到了defineReactive方法，里面就是运用了Object.defineProperty()劫持数据，是vue实现双向绑定的基础，本质上就是代理了数据的set,get方法，能够监听数据修改或者读取。这个方法非常重要，放到后面再详细说一下。

#### observeArray
observeArray方法的作用主要是遍历了一遍数组，并对每一个元素调用了observe()函数，从而为其添加Observer.

#### Observer在实例化的时候做的事情（Observer总结）
* 将Observer类的实例挂载在__ob__属性上，提供后续观测数据使用，以及避免被重复实例化。然后，实例化Dep类实例，并且将对象/数组作为value属性保存下来
* Observer对象在实例化的时候，会判断一下观察的data是数组还是对象。如果是对象，执行walk方法遍历对象属性（调用defineReactive方法处理），把每一项数据都变为可观测数据。如果对象中有属性为对象或者数组，也会给其添加observer。
* 如果传入的data是数组，vue首先会进行增强数组的操作。通过继承Array.prototype,改写数组的原生push(), pop(), shift(), unshift(), splice(), sort(), reverse()等方法，使得数组中的属性的添加，删除可以被监听到，从而触发视图的更新（数组是没有Object.defineProperty(obj, prop, descriptor)这个方法的）。增强数组后，Vue还会调用observeArray方法，为其添加Observer，把每一项数据都变为可观测数据。

## defineReactive方法
defineReactive方法主要的作用是处理对象属性，把对象中的属性转化为getter/setter对，当data被取值的时候触发 getter 并搜集依赖，当被修改值的时候触发 setter 并派发更新。这也是整个vue区别于其他框架的核心所在。

在defineReactive方法里，我们会先实例化一个dep对象，然后判断一下传进来的对象是不是可以配置的，在可配置的情况下，获取这个对象对应的key的值，然后通过刚才提到的observe方法，给这个值配一个Observer，得到一个childObserver。
接下来会通过Object.defineProperty重新配置对象属性的setter和getter.
### getter
* 在getter和setter里，相对于defineReactive上下文的var dep = new Dep()形成了闭包，从而很巧妙地保存了dep实例。Dep在这里的作用是收集依赖，并在适当的时候通知订阅者目标数据已经更新。
* 在getter里,vue 首先会判断一下Dep.Target是否存在。Dep.Target在什么时候会存在呢？当vue处理watcher类的时候，在watcher初始化时会将当前Watcher实例赋给Dep.target。在访问getter之前，vue就已经进入了某个watcher的上下文了，所以有一件事情是可以保证的：Watcher类的实例watcher已经准备好了，并且已经调用了watcher.get()，Dep.target是有值的。当Dep.Target存在时，就会调用dep.depend方法，把Dep.target添加进观察者列表。这样在该属性的setter被调用的时候，这个dep就可以通知Dep.target了
* 执行了dep.depend后,会进入下一个判断，判断之前所提到的childObserver是否存在，如果存在，就会执行 childObserver.dep.depend() 为其添加依赖。childObserver存在的意义是为了解决Object.definedProperty()只能监听到属性的更改，不能监听到属性的删除与添加这个问题。我们都知道Vue提供了内置的Vue.set(), Vue.delete()方法来让我们响应式的添加和删除数组的元素或对象的属性。在Vue.delete()的源码里，我们可以看到，当删除掉一个属性后，childOb执行它的notify方法，通知watcher属性被删除。vue.set原理也差不多。所以为什么在getter方法中要添加childOb的依赖，就是为了在删除或者添加属性的时候进行通知。
* 在defineReactive函数中的getter方法中，对数组有一个额外的处理过程：如果value为数组，那么对其执行dependArray函数。（递归添加依赖）。这一切的根本原因，就是数组没法通过getter/setter对象来监听元素的变化。

总结：其实概括性地说，getter所做的事情就是执行dep.depend(),把Dep.target添加进自己的观察者列表，然后执行getter，接着将自己从Dep.target移除，清理之前的订阅。在这个过程中，当属性的setter被调用的时候，dep实例就可以通知Dep.target（当前watcher实例）了
### setter
setter相对会简单一点。
setter首先会判断一下传进来的值有没有变化（相对于data属性旧值val，从definedReactive传入），有变化的情况下调用了dep.notify(),当设置data中具体属性值的时候，就会调用该属性下面的dep.notify()方法，通过Dep了解到，notify方法即将加入该dep的watcher全部更新，也就是说，当你修改data中某个属性值时，会同时调用dep.notify()来更新依赖该值的所有watcher（通过调用subs数组里存储的watcher的update方法。）。

## watcher
```js
// src/core/observer/watcher.js
constructor (
    vm: Component,
    expOrFn: string | Function,
    cb: Function,
    options?: Object
  ) {
    this.vm = vm
    vm._watchers.push(this)
    if (options) {
      this.deep = !!options.deep
      this.user = !!options.user
      this.lazy = !!options.lazy
      this.sync = !!options.sync
    } else {
      this.deep = this.user = this.lazy = this.sync = false
    }
    this.cb = cb
    this.id = ++uid // uid for batching
    this.active = true
    this.dirty = this.lazy // 如果初始化lazy=true时（暗示是computed属性），那么dirty也是true,需要等待更新
    this.deps = []
    this.newDeps = []
    this.depIds = new Set()
    this.newDepIds = new Set()
    this.getter = expOrFn // 在computed实例化时，将具体的属性值放入this.getter中
    // 省略不相关的代码
    this.value = this.lazy
      ? undefined
      : this.get()
  }
```
```js
class Dep{
    depend () { // 添加依赖，也就是把当前Dep.target添加到这个dep实例的subs列表中
      if (Dep.target) {
        Dep.target.addDep(this)
      }
  }
}
```
Watcher扮演的角色是观察者，它关心数据，在数据变化后能够获得通知，并作出处理。一个组件里可以有多个Watcher类实例，Watcher类包装观察者函数，而观察者函数使用被依赖的数据。
1. watcher实例化的时候首先传入组件实例，观察者函数（视图render、计算属性、侦听器），回调函数，选项等。下一步我们首先要理解四个变量：deps、depIds、newDeps、newDepIds。
* deps：缓存上一轮执行观察者函数用到的dep实例
* depIds：Hash表，用于快速查找
* newDeps：存储本轮执行观察者函数用到的dep实例
* newDepIds：Hash表，用于快速查找

2. 进行初始求值，初始求值时，会调用watcher.get()方法。watcher.get()会做以下处理：初始准备工作、调用观察者函数计算、事后清理工作 。
* 在初始准备工作里，会将当前Watcher实例赋给Dep.target，清空数组newDeps、newDepIds 
* 执行观察者函数进行计算。由于数据观测阶段执行了defineReactive()，所以计算过程用到的数据如果被访问了会触发数据的getter，从而执行watcher.addDep()方法，将特定的数据记为依赖 
* 对每个数据执行watcher.addDep(dep)后，数据对应的dep如果在newDeps里不存在，就会加入到newDeps里，这是因为一次计算过程数据有可能被多次使用，但是同样的依赖只能收集一次。并且如果在deps不存在，表示上一轮计算中，当前watcher未依赖过某个数据，那个数据相应的dep.subs里也不存在当前watcher，所以要将当前watcher加入到数据的dep.subs里 
```js
Watcher.prototype.addDep = function (dep) {
    var id = dep.id
    if (!this.newDepIds[id]) {
        this.newDepIds[id] = true
        this.newDeps.push(dep)
        if (!this.depIds[id]) {
            dep.addSub(this)
        }
    }
}

depend() {
        Dep.target.addDep(this);
    }
```
* 进行事后清理工作，首先释放Dep.target，然后拿newDeps和deps进行对比，接着进行以下的处理： 
  - newDeps里不存在而deps里存在的数据，表示是过期的缓存数据。相应的，从数据对应的dep.subs移除掉当前watcher 
  - 将newDeps赋给deps，表示缓存本轮的计算结果，这样子下轮计算如果再依赖同一个数据，就不需要再收集了

3. 当某个数据更新时，由于进行了setter拦截，所以会对该数据的dep.subs这一观察者队列里的watchers进行通知，从而执行watcher.update()方法，而update()方法会重复求值过程（即调用watcher.get），从而使得观察者函数重新计算，而render()这种观察者函数重新计算的结果，就使得视图同步了最新的数据

# 虚拟DOM及Diff算法
