
什么是防抖？什么是节流？

举例来说，比如要搜索某个字符串，基于性能考虑，肯定不能用户每输入一个字符就发送一次搜索请求，一种方法就是等待用户停止输入，比如过了500ms用户都没有再输入，那么就搜索此时的字符串，这就是防抖；节流比防抖宽松一些，比如我们希望给用户一些搜索提示，所以在用户输入过程中，每过500ms就查询一次相关字符串，这就是节流。

实现这两种方法的核心其实都是setTimeout方法。

函数防抖一般是指对于在事件被触发n秒后再执行的回调，如果在这n秒内又重新被触发，则重新开始计时。

二者都能防止函数过于频繁的调用。

区别在于，当事件持续被触发，如果触发时间间隔短于规定的等待时间（n秒），那么

- 函数防抖的情况下，函数将一直推迟执行，造成不会被执行的效果；
- 函数节流的情况下，函数将每个 n 秒执行一次。

### 节流(throttle)：对于持续触发的事件，规定一个间隔时间（n秒），每隔一段只能执行一次。
``` js
// fn是我们需要包装的事件回调, delay是时间间隔的阈值
export function throttle(fn: Function, delay: number) {
  // last为上一次触发回调的时间, timer是定时器
  let last = 0,
    timer: any = null;
  // 将throttle处理结果当作函数返回
  return function() {
    // 保留调用时的this上下文
    let context = this;
    // 保留调用时传入的参数
    let args = arguments;
    // 记录本次触发回调的时间
    let now = +new Date();
    // 判断上次触发的时间和本次触发的时间差是否小于时间间隔的阈值
    if (now - last < delay) {
      // 如果时间间隔小于我们设定的时间间隔阈值，则为本次触发操作设立一个新的定时器
      clearTimeout(timer);
      timer = setTimeout(function() {
        last = now;
        fn.apply(context, args);
      }, delay);
    } else {
      // 如果时间间隔超出了我们设定的时间间隔阈值，那就不等了，无论如何要反馈给用户一次响应
      last = now;
      fn.apply(context, args);
    }
  };
}
```


*** 
### 防抖(debounce)：指的是某个函数在某个时间段内，无论触发多少次，都只执行最后一次。(防抖的实现思路：每次触发事件时都取消之前的延时调用方法：)
``` js
function debounce(fn, wait=100) {
	// 设定定时器
	let timer = null;

	return function(...args) {
		if(timer) {
			clearTimeout(timer);
		}

		timer = setTimeout(() => {
			fn.apply(this, args)
		}, wait);
	}
}

// 定义一个实例接收
const bus = debounce(() => {
	const node = document.createElement("span");
	const textNode = document.createTextNode("🚗");
	node.appendChild(textNode);
	document.getElementById("debounceImg").appendChild(node);
	console.log("有人上车了, 请再等一等！");
}, 1000);

document.getElementById("debounce").addEventListener("scroll", bus);
```