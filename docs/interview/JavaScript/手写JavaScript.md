[手写深拷贝](./深拷贝与浅拷贝.md)

[手写 new](./原型与原型链.md#3-new-的实现原理)

[手写 instanceof](./原型与原型链.md#7-instanceof-的实现原理)

[手写 call / apply / bind](./this和call、apply、bind.md#5-手写-call-和-apply)

[手写 Promise.[all/race/allSettled/any]](./异步和Promise.md#32-promiseall)

[手写限制并发请求、手写 retry](./异步和Promise.md#4-手写题)

## 1. 手写防抖和节流

### 1.1 防抖

有的操作是高频触发的，但其实等高频事件操作结束，只触发一次就好了。

应用场景：

- 监听输入框输入，不应该每次都去触发监听，应该是用户完成一段输入后，再进行触发。
- 短时间内多次缩放页面，不应该每次缩放都去执行操作，拖动完成只缩放一次就好。

```javascript
/*
 * @param {function} fn - 需要防抖的函数
 * @param {number} time - 多长时间执行一次
 * @param {boolean} flag - 第一次是否执行
 */
function debounce(fn, time, flag) {
  let timer;
  return function (...args) {
    // 在time时间段内重复执行，会清空之前的定时器，然后重新计时
    timer && clearTimeout(timer);
    if (flag && !timer) {
      // flag为true 第一次默认执行
      fn.apply(this, args);
    }
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, time);
  };
}

function fn(a) {
  console.log("执行:", a);
}
let debounceFn = debounce(fn, 3000, true);
debounceFn(1);
debounceFn(2);
debounceFn(3);

// 先打印：执行: 1
// 3s后打印: 执行: 3
```

### 1.2 节流

某个操作希望上一次的完成后再进行下一次，或者说希望隔一定时间触发一次。

应用场景：

- 如果一个按钮，第一次点击就发送请求。然后上一个请求回来后，才能再发；
- 监听输入框输入，正在输入时每隔 200 毫秒给出提示。
- 下拉滚动加载

```javascript
/*
 * @param {function} fn - 需要防抖的函数
 * @param {number} time - 多长时间执行一次
 * @param {boolean} flag - 第一次是否执行
 */
function throttle(fn, time, flag) {
  let timer;
  return function (...args) {
    // flag控制第一次是否立即执行
    if (flag) {
      fn.apply(this, args);
      // 第一次执行完后，flag变为false；否则以后每次都会执行
      flag = false;
    }
    if (!timer) {
      timer = setTimeout(() => {
        fn.apply(this, args);
        clearTimeout(timer);
        // 每次执行完重置timer
        timer = null;
      }, time);
    }
  };
}

// 测试
function fn() {
  console.log("fn");
}
let throttleFn = throttle(fn, 3000, true);
setInterval(throttleFn, 500);
// 一开始就打印"fn", 以后每隔3s打印一次"fn"
```

## 2. 函数柯里化

柯里化是把接收多个参数的函数转换成一系列接收不限参数个数的函数。如果你固定某些参数，你将得到接受余下参数的一个函数。

原理：用闭包把参数保存起来，当参数的长度等于原函数时，就开始执行原函数。

这是一种对函数参数的“缓存”，让函数变的更灵活，粒度更小。

bind 函数就是柯里化函数的一种。

```javascript
function curry(func) {
  return function curriedFn(...args) {
    // 判断实参和形参的个数，其中func.length返回函数的形参个数
    return args.length < func.length ? (...args2) => curriedFn(...args, ...args2) : func(...args);
  };
}
```

```javascript
function add(a, b, c) {
  return a + b + c;
}

let curriedAdd = curry(add);
console.log(curriedAdd(1, 2, 3)); // 6
console.log(curriedAdd(1, 2)(3)); // 6
console.log(curriedAdd(1)(2)(3)); // 6
```

可以固定一个函数的前几个参数。

```javascript
const match = curry(function (reg, str) {
  return str.match(reg);
});

const haveSpace = match(/\s+/g);
console.log(haveSpace("hello world")); // [' ']

const haveNumber = match(/\d+/g);
console.log(haveNumber("25$")); // ['25']
```

## 3. 手写数组原型方法

### 3.1 Array.prototype.forEach()

forEach() 方法对数组的每个元素执行一次给定的函数。

```javascript
Array.prototype.myForEach = function (callback) {
  if (typeof callback !== "function") {
    throw new Error("must be a function!");
  }

  const len = this.length;
  for (let i = 0; i < len; i++) {
    callback.call(this, this[i], i);
  }
};
```

```javascript
// 测试
const arr = ["a", "b", "c"];
arr.myForEach((item, index) => {
  console.log(index + ": " + item);
});
// 0: a
// 1: b
// 2: c
```

### 3.2 Array.prototype.map()

map() 方法返回一个新数组，新数组由原数组中的每个元素都调用一次指定函数后的返回值组成。

```javascript
Array.prototype.myMap = function (callback) {
  if (typeof callback !== "function") {
    throw new Error("must be a function!");
  }

  const len = this.length,
    arr = [];
  for (let i = 0; i < len; i++) {
    arr.push(callback.call(this, this[i], i));
  }
  return arr;
};
```

```javascript
// 测试
const arr1 = [1, 2, 3];
const arr2 = arr1.myMap((item) => item * item);
console.log(arr2);
// [1, 4, 9]
```

### 3.3 Array.prototype.filter()

filter() 方法会返回一个新数组，该新数组由调用回调函数返回 true 的项组成。

```javascript
Array.prototype.myFilter = function (callback) {
  if (typeof callback !== "function") {
    throw new Error("must be a function!");
  }

  const len = this.length,
    arr = [];
  for (let i = 0; i < len; i++) {
    if (callback.call(this, this[i], i)) {
      // 如果该项是对象，进行拷贝后加入新数组
      if (typeof this[i] === "object") {
        arr.push(Object.create(this[i])); // 待确认
      } else {
        arr.push(this[i]);
      }
    }
  }
  return arr;
};
```

```javascript
// 示例：获取数组中的偶数
const arr1 = [4, 7, 2, 0, 1, 5, 9];
const arr2 = arr1.myFilter((item) => item % 2 === 0);
console.log(arr2);
// [4, 2, 0]
```

### 3.4 Array.prototype.reduce()

reduce() 方法对数组中的每个元素按序执行一个由您提供的 reducer 函数，每一次运行 reducer 会将先前元素的计算结果作为参数传入，最后将其结果汇总为单个返回值。

第一次执行回调函数时，不存在“上一次的计算结果”。如果需要回调函数从数组索引为 0 的元素开始执行，则需要传递初始值。否则，数组索引为 0 的元素将被作为初始值，迭代器将从第二个元素（索引为 1）开始执行。

```javascript
Array.prototype.myReduce = function (callback, initVal) {
  if (typeof callback !== "function") {
    throw new Error("must be a function!");
  }

  const len = this.length;

  let pre = initVal,
    i = 0;

  //没有传入初始值，数组第一位默认为初始值，当前元素索引值变为1
  if (pre == undefined) {
    if (len < 1) {
      throw new Error("Reduce of empty array with no initial value!");
    }
    pre = this[0];
    i = 1;
  }

  for (; i < len; i++) {
    pre = callback.call(this, pre, this[i], i, this);
  }

  return pre;
};
```

累加或累乘

```javascript
const arr = [5, 2, 3];
let plus = arr.myReduce((pre, cur) => pre * cur);
console.log(plus);
// 30
```

有条件累计

```javascript
const arr = [
  {
    type: "all",
    num: 1,
  },
  {
    type: "no",
    num: 2,
  },
  {
    type: "all",
    num: 3,
  },
];
let sum = arr.myReduce((pre, cur) => {
  if (cur.type === "all") {
    pre += cur.num;
  }
  return pre;
}, 0);
console.log(sum);
// 4
```

数组转对象

```javascript
const arr = [
  {
    path: "/login",
    components: "/login.vue",
  },
  {
    path: "/home",
    components: "/home.vue",
  },
];
const obj = arr.myReduce((pre, cur) => {
  pre[cur.path] = cur.components;
  return pre;
}, {});
console.log(obj);
// {/login: '/login.vue', /home: '/home.vue'}
```

### 3.5 Array.prototype.flat()

flat() 方法是数组扁平化，根据指定深度递归地将所有子数组元素拼接到新的数组中，返回一个新数组。

```javascript
Array.prototype.myFlat = function (depth = 1) {
  function flat(arr, depth) {
    if (depth < 1) {
      return arr;
    }
    const res = [];
    const len = arr.length;
    for (let i = 0; i < len; i++) {
      const item = Array.isArray(arr[i]) ? flat(arr[i], depth - 1) : [arr[i]];
      res.push(...item);
    }
    return res;
  }
  return flat(arr, depth);
};
```

```javascript
const arr = [0, 1, [2, [3, [4, 5]]]];

console.log(arr.myFlat());
// [0, 1, 2, [3, [4, 5]]]

console.log(arr.myFlat(2));
// [0, 1, 2, 3, [4, 5]]
```
