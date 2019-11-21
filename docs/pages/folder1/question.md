### 1、ios中用fixed定位时，软键盘弹出会遮住fixed定位的元素。
#### 解决：不用fixed定位；
### 2、在公众号开发中，iOS系统11以上，微信系统6.0以上，软键盘弹出页面往上滚动，但是软键盘收起之后，页面不会回弹
#### 解决
``` js 
    fixIosWxInputBug(){
        let myFunction
        let isWXAndIos = this.isWeiXinAndIos()
        if (isWXAndIos) { // 既是微信浏览器 又是ios============（因为查到只有在微信环境下，ios手机上才会出现input失去焦点的时候页面被顶起）
            document.body.addEventListener('focusin', () => { // 软键盘弹起事件
                clearTimeout(myFunction)
            })
            document.body.addEventListener('focusout', () => { // 软键盘关闭事件
                clearTimeout(myFunction)
                myFunction = setTimeout(function() {
                    window.scrollTo({top: 0, left: 0, behavior: 'smooth'})// 重点  =======当键盘收起的时候让页面回到原始位置
                }, 200)
            })
        }
    }
```
### 3、华为浏览器对background的缩写不识别

### 4、ios8 对flex不兼容，transform: translate()也不兼容，用定位

### 5、text-align属性对应用了position:absloute/fixed声明的元素无效！
原因：没有应用left/top等属性值的absolute元素就是个不占据空间的普通元素，又因为包裹性，如果是block水平的，换行显示；如果是inline水平的，跟在前面的文字后面显示。text-align属性作用的不是absolute元素，而是absolute元素之前的文字而已，因为HTML5下块状元素内部的内联元素被所谓的幽灵节点所作用而导致。
方法：
``` css
.center{
    margin-left:-"1/2个元素宽度";
    left:50%;
    position:absolute;
}
```
