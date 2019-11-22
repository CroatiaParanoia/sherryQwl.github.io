## writing-mode调整文本排版方向；
## text-align-last:justify设置文本两端对齐

``` css
 /* 通过object-fit使图像脱离background-size的约束，使用<img>来标记图像背景尺寸 */
img {
    width: 100%;
    height: 260px;
    &.cover {
    	object-fit: cover;
    }
    &.contain {
    	object-fit: contain;
    }
    &.fill {
    	object-fit: fill;
    }
    &.scale-down {
    	object-fit: scale-down;
    }
}
```
## 使用transform描绘1px边框
通过::before或::after和transform模拟细腻的1px边框
```css
.thin {
	position: relative;
	&::after {
		position: absolute;
		left: 0;
		top: 0;
		border: 1px solid $red;
		width: 200%;
		height: 200%;
		content: "";
		transform: scale(.5);//描绘1px边框
		transform-origin: left top;
	}
}
```
## letter-spacing设置负值字体间距将文本倒序
``` css
.reverse-text {
	font-weight: bold;
	font-size: 50px;
	color: $red;
	letter-spacing: -100px; // letter-spacing最少是font-size的2倍
}
```

## 移动端使用 rem 单位适配
``` js
// 屏幕适配（ window.screen.width / 移动端设计稿宽 * 100）也即是 (window.screen.width / 750 * 100)  ——*100 为了方便计算。即 font-size 值是手机 deviceWidth 与设计稿比值的 100 倍
document.getElementsByTagName('html')[0].style.fontSize = window.screen.width / 7.5 + 'px';
```
如上：通过查询屏幕宽度，动态的设置 html 的 font-size 值，移动端的设计稿大多以宽为 750 px 来设置的。

比如在设计图上一个 150 * 250 的盒子(单位 px)：

原本在 css 中的写法：
``` css
width: 150px;
heigth: 250px;
```
通过上述换算后，在 css 中对应的 rem 值只需要写：
``` css
width: 1.5rem; // 150 / 100 rem
heigth: 2.5rem; // 250 / 100 rem
```
如果你的移动端的设计稿是以宽为 1080 px 来设置的话，就用 window.screen.width / 10.8 吧。

### Chrome不能显示小于12px的字体的解决办法，同时解决-webkit-transform:
``` css
 scale不支持行内标签的问题
/* 10px字号 */
.chrome10px { 
  display: inline-block;
  font-size:10px;
  -webkit-transform:scale(0.9);
}
```

### 最全的 “文本溢出截断省略” 方案合集
[最全的 “文本溢出截断省略” 方案合集](https://juejin.im/post/5dc15b35f265da4d432a3d10)