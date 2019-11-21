#### 数组去重：
``` js
let arr = [2,3,2,4,5,2,8,5];
let newArr = [...new Set(arr)];

console.log(newArr); //[2, 3, 4, 5, 8]
```

#### 数组的方法：
###### 1、push/pop：末尾推入和弹出，改变愿数组，返回推入/弹出项；
###### 2、unshift/shift：头部推入和弹出，改变原数组，返回操作项；
###### 3、slice（start，end）：返回截断后的新数组，不改变原数组；
###### 4、splice（start，number，value···）：返回删除元素组成的数组，value为插入值，改变原数组；

``` js
let arr = [3，2，6，9，1，5];
let arr2 = arr.slice(0,3); // arr2=[ 3, 2, 6 ]

let arr3 = arr.splice( 0, 1, 8);//arr3 = [ 3 ],arr=[ 8，2，6，9，1，5]
```

###### call:B.call( A, args1, args2 ),即A对象调用B对象的方法；
###### apply：B.apply( A, arguments ),即A对象调用B对象的方法；
###### bind:返回一个新函数，未被调用；