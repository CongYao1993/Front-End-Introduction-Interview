## 1. new Vue() 实例挂载的过程

Vue 是一个构造函数，只能通过 new 关键字初始化，然后会调用 `this._init` 方法。

options 是用户传递过来的配置项，如 data、methods、props、computed、watch 等。

```javascript
// src/core/instance/index.js

function Vue(options) {
  if (process.env.NODE_ENV !== "production" && !(this instanceof Vue)) {
    warn("Vue is a constructor and should be called with the `new` keyword");
  }
  this._init(options);
}
```

`this._init`会执行一系列的初始化步骤，从创建到挂载 Vue 实例。

1. **合并选项**：Vue 会将传入的选项对象与默认选项进行合并。这包括 data、methods、computed、watch 等配置项。
2. **初始化生命周期**：设置一些内部变量和标志，为后续的生命周期钩子做准备。
3. **初始化事件**：处理父组件传入的事件监听器，将它们存储在实例上。
4. **初始化渲染函数**：如果有 render 函数，则直接使用；否则，将 template 编译成 render 函数。
5. `beforeCreate`：此时数据观测和事件还未初始化。
6. **初始化 inject**：解析 inject 选项，得到注入的属性。
7. **初始化状态**：依次处理 props、methods、data 并将其转换为响应式，初始化 computed 和 watch。
8. **初始化 provide**：解析 provide 选项，使得子组件可以注入。
9. `created`：此时，响应式数据、计算属性、方法和侦听器都已经设置好了。
10. **开始挂载阶段**：如果有 el 选项，则自动开始挂载过程。
11. `beforeMount 钩子`：在挂载开始之前被调用。
12. **挂载**：创建 Vue 实例的 \$el 并用其替换 "el" 选项对应的元素。
13. `mounted 钩子`：此时，Vue 实例已经挂载到 DOM 上，可以访问到 \$el。

```javascript
// src/core/instance/init.js

Vue.prototype._init = function (options?: Object) {
  const vm: Component = this;
  // a uid
  vm._uid = uid++;
  let startTag, endTag;
  /* istanbul ignore if */
  if (process.env.NODE_ENV !== "production" && config.performance && mark) {
    startTag = `vue-perf-start:${vm._uid}`;
    endTag = `vue-perf-end:${vm._uid}`;
    mark(startTag);
  }

  // a flag to avoid this being observed
  vm._isVue = true;
  // merge options
  // 合并属性，判断初始化的是否是组件，这里合并主要是 mixins 或 extends 的方法
  if (options && options._isComponent) {
    // optimize internal component instantiation
    // since dynamic options merging is pretty slow, and none of the
    // internal component options needs special treatment.
    initInternalComponent(vm, options);
  } else {
    // 合并 vue 属性
    vm.$options = mergeOptions(resolveConstructorOptions(vm.constructor), options || {}, vm);
  }
  /* istanbul ignore else */
  if (process.env.NODE_ENV !== "production") {
    // 初始化 proxy 拦截器
    initProxy(vm);
  } else {
    vm._renderProxy = vm;
  }
  // expose real self
  vm._self = vm;
  // 初始化组件生命周期标志位
  initLifecycle(vm);
  // 初始化组件事件侦听
  initEvents(vm);
  // 初始化渲染方法
  initRender(vm);
  callHook(vm, "beforeCreate");
  // resolve injections before data/props
  initInjections(vm);
  // 初始化 props/methods/data/computed/watch
  initState(vm);
  // resolve provide after data/props
  initProvide(vm);
  callHook(vm, "created");

  /* istanbul ignore if */
  if (process.env.NODE_ENV !== "production" && config.performance && mark) {
    vm._name = formatComponentName(vm, false);
    mark(endTag);
    measure(`vue ${vm._name} init`, startTag, endTag);
  }
  // 挂载元素
  if (vm.$options.el) {
    vm.$mount(vm.$options.el);
  }
};
```

initState 是初始化 props/methods/data/computed/watch。

```javascript
// src\core\instance\state.js

export function initState(vm: Component) {
  // 初始化组件的 watcher 列表
  vm._watchers = [];
  const opts = vm.$options;
  // 初始化 props
  if (opts.props) initProps(vm, opts.props);
  // 初始化 methods 方法
  if (opts.methods) initMethods(vm, opts.methods);
  // 初始化 data
  if (opts.data) {
    initData(vm);
  } else {
    observe((vm._data = {}), true /* asRootData */);
  }
  // 初始化 computed
  if (opts.computed) initComputed(vm, opts.computed);
  // 初始化 watch
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch);
  }
}
```

## 2. Vue 响应式原理

Vue 的响应式使用了观察者模式，没有事件中心。

- Dep 是目标、发布者
  - subs 数组：存储所有的观察者
  - addSub()：添加观察者，将其保存到 subs 数组中
  - notify()：当事件发生后，调用所有观察者的 update() 方法。
- Watcher 是观察者、订阅者
  - update(): 当事件发生时，具体要做的事情。

### 2.1 实现一个基本的响应式框架：

1. 定义 observe 函数，遍历 data 中的所有属性，使用 Object.defineProperty 把所有属性转为 getter/setter ，每一个属性对应一个 dep 对象，用来存储对应的 watcher 观察者
2. 定义 compile 函数，模板编译，从 Vue 挂载的节点开始遍历 DOM，遇到双大括号{{key}}形式的文本，则替换成 data.key 对应的值，getter 将该 DOM 节点添加到对应 key 值的 dep 对象中
3. 当 data 的数据变化时，setter 调用 dep 对象的 notify 方法，更新所有观察者中的 dom 节点

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>vue的MVVM简单实现</title>
  </head>
  <body>
    <div id="app">
      <p>姓名: <span>{{name}}</span></p>
      <p>年龄: <span>{{age}}</span></p>
    </div>
    <script>
      window.onload = function () {
        // new 一个 Vue 实例
        const vue = new Vue({
          el: "#app",
          data: {
            name: "加载中",
            age: "18",
          },
        });
        // 2s 后更新页面的信息
        setTimeout(() => {
          // 修改vue中$data的name和age属性
          vue.$data.name = "小明";
          vue.$data.age = 20;
        }, 2000);
      };
      class Vue {
        constructor(options) {
          this.options = options;
          this.$data = options.data;
          this.observe(options.data);
          this.compile(document.querySelector(options.el));
        }
        // 监听 data 中属性的变化
        observe(data) {
          Object.keys(data).forEach((key) => {
            // 给 data 中的每一个属性添加一个 dep 对象（该对象用来存储对应的watcher观察者）
            let dep = new Dep();
            // 利用闭包，获取和设置属性的时候，操作的都是 value
            let value = data[key];
            Object.defineProperty(data, key, {
              get() {
                // 收集依赖：获取属性值时，向观察者对象中添加对应的 dom 节点
                Dep.target && dep.addSub(Dep.target);
                return value;
              },
              set(newValue) {
                if (value === newValue) {
                  return;
                }
                value = newValue;
                // 触发依赖：属性值变化时，更新观察者中所有节点
                dep.notify(newValue);
              },
            });
          });
        }
        compile(dom) {
          dom.childNodes.forEach((child) => {
            // nodeType 为 3 时为文本节点，并且该节点的内容包含双大括号{{}}
            if (child.nodeType === 3 && /\{\{(.*)\}\}/.test(child.textContent)) {
              // RegExp.$1 是正则表达式匹配的第一个字符串，这里对应的就是 data 中的 key 值
              let key = RegExp.$1.trim();
              // 将该节点添加到对应的观察者对象中，
              Dep.target = child;
              // 将{{ key }} 替换成 data 中对应的值，在 this.options.data[key] 中触发对应的 get 方法
              child.textContent = child.textContent.replace(`{{${key}}}`, this.options.data[key]);
              Dep.target = null;
            }
            // 递归遍历子节点
            if (child.childNodes.length) {
              this.compile(child);
            }
          });
        }
      }

      // dep 对象存储所有的观察者
      class Dep {
        constructor() {
          this.subs = [];
        }
        // 添加 watcher
        addSub(node) {
          this.subs.push(node);
        }
        // 更新 watcher
        notify(value) {
          this.subs.forEach((node) => {
            node.textContent = value;
          });
        }
      }
    </script>
  </body>
</html>
```

### 2.2 Vue2 数据劫持有什么缺点

Vue 不允许动态添加根级响应式 property，所以你必须在初始化实例前声明所有根级响应式 property。

使用 Object.defineProperty() 观察 data：

- 无法检测对象属性的添加或删除

```javascript
// 向对象添加响应式属性
Vue.set(this.someObject, "b", 2);
this.$set(this.someObject, "b", 2);

// 向已有对象添加新的多个属性
// 代替 `Object.assign(this.someObject, { a: 1, b: 2 })`
this.someObject = Object.assign({}, this.someObject, { a: 1, b: 2 });
```

- 不能检测以下数组的变动：
  - 当你利用索引直接设置一个数组项时，例如：vm.items[indexOfItem] = newValue
  - 当你修改数组的长度时，例如：vm.items.length = newLength

Vue 重写了 Array 原型链上的方法 splice()、 push()、pop()、shift()、unshift()、sort()、reverse() ，调用这些方法会 observe 数据。

```javascript
// 修改数组中的某一项
this.items.splice(indexOfItem, 1, newValue);
Vue.set(this.items, indexOfItem, newValue);
this.$set(this.items, indexOfItem, newValue);

// 修改数组长度：newLength 必须小于当前长度，数组中新长度之后所有元素被删除
this.items.splice(newLength);
```

### 2.3 Vue3 使用 Proxy 实现响应式

Proxy 默认只代理一层对象的属性；对于`obj.a.b=0`，会先 get`obj.a`，再 set`obj.a.b`；对于`obj.a.b`，也会 get 两次。

```javascript
function observe(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      // todo: 收集依赖

      let result = Reflect.get(target, key, receiver);
      // 递归获取对象多层嵌套的情况，如obj.a.b
      return typeof result === "object" && result !== null ? observe(result) : result;
    },
    set(target, key, value, receiver) {
      // todo: 更新依赖

      return Reflect.set(target, key, value, receiver);
    },
  });
}
```

### 2.4 computed 原理

计算属性本质上是 `computed watcher`。

1. 在 created 之前会 initState，包含 initComputed；

- 遍历 computed 对象，给其中每一个计算属性分别生成一个 `computed watcher`，并将该 watcher 中的 dirty 设置为 true；
  - initComputed 时，计算属性并不会立即计算，只有当获取计算属性值时才会计算
- 将 Dep.target 设置成当前的 `computed watcher`，将 `computed watcher` 添加到所依赖 data 值对应的 dep 中（收集依赖），然后计算 computed 对应的值，将 dirty 改成 false

2. 当所依赖 data 中的值发生变化时，调用 set 方法触发 dep 的 notify 方法，将 `computed watcher` 中的 dirty 设置为 true
3. 渲染 watcher 订阅 `computed watcher` 的变化，所以当渲染 watcher 重新渲染时，会获取计算属性值，若 dirty 为 true, 重新计算属性的值

dirty 是控制缓存的关键，当所依赖的 data 发生变化，dirty 设置为 true，再次被获取时，就会重新计算。

```javascript
// 空函数
const noop = () => {};
// computed 初始化的 Watcher 传入 lazy: true，设置 Watcher 中的 dirty 为 true
const computedWatcherOptions = { lazy: true };
// Object.defineProperty 默认 value 参数
const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop,
};

// 初始化 computed
class initComputed {
  constructor(vm, computed) {
    // 新建存储 Watcher 对象，挂载在 vm 对象执行
    const watchers = (vm._computedWatchers = Object.create(null));
    // 遍历 computed
    for (const key in computed) {
      const userDef = computed[key];
      // getter 值为 computed 中 key 的监听函数或对象的 get 值
      let getter = typeof userDef === "function" ? userDef : userDef.get;
      // 新建 computed watcher
      watchers[key] = new Watcher(vm, getter, noop, computedWatcherOptions);
      if (!(key in vm)) {
        // 定义计算属性
        this.defineComputed(vm, key, userDef);
      }
    }
  }

  // 重新定义计算属性，利用 Object.defineProperty 来对计算属性的 get 和 set 进行劫持
  defineComputed(target, key, userDef) {
    // 如果是一个函数，需要手动赋值到 get 上
    if (typeof userDef === "function") {
      sharedPropertyDefinition.get = this.createComputedGetter(key);
      sharedPropertyDefinition.set = noop;
    } else {
      sharedPropertyDefinition.get = userDef.get
        ? userDef.cache !== false
          ? this.createComputedGetter(key)
          : userDef.get
        : noop;
      // 如果有 set 方法则直接使用，否则赋值空函数
      sharedPropertyDefinition.set = userDef.set ? userDef.set : noop;
    }
    Object.defineProperty(target, key, sharedPropertyDefinition);
  }

  // 计算属性的 getter，获取计算属性的值时会调用
  createComputedGetter(key) {
    return function computedGetter() {
      // 获取对应的计算属性 watcher
      const watcher = this._computedWatchers && this._computedWatchers[key];
      if (watcher) {
        // dirty 为 true，计算属性需要重新计算
        if (watcher.dirty) {
          // 包含 pushTarget(this)，将该 computed watcher 添加到所依赖 data 值对应的 dep 中
          watcher.evaluate();
        }
        // 收集依赖该 computed 属性的 DOM 元素等
        if (Dep.target) {
          watcher.depend();
        }
        // 返回计算属性的值
        return watcher.value;
      }
    };
  }
}
```

### 2.5 watch 原理

1. 遍历 watch 对象， 给其中每一个 watch 属性，生成对应的 `user watcher`
2. 调用 watcher 中的 get 方法，将 Dep.target 设置成当前的 `user watcher`，并将 `user watcher` 添加到监听 data 值对应的 dep 中（收集依赖）
3. 当所监听 data 中的值发生变化时，会调用 set 方法触发 dep 的 notify 方法，执行 watcher 中定义的方法

`deep：true` 原理：递归遍历所监听的对象，将 `user watcher` 添加到对象中每一层 key 值的 dep 对象中，这样无论当对象的中哪一层发生变化，wacher 都能监听到。

## 3. 虚拟 DOM 和 diff 算法

### 3.1 虚拟 DOM

虚拟 DOM (Virtual DOM，简称 VDOM) 是通过 JavaScript 的对象描述真实的 DOM 节点，虚拟 DOM 最少包含标签名 (tag)、属性 (attrs) 和子元素对象 (children) 三个属性。

```javascript
// <div id="hello">你好</div>
const vnode = {
  type: "div",
  text: "你好",
  props: {
    id: "hello",
  },
  children: [
    /* 更多 vnode */
  ],
};
```

- 运行时，渲染器将会遍历整个虚拟 DOM 树，构建真实的 DOM 树。这个过程被称为挂载 (mount)。
- 修改响应式数据后，计算新 DOM 树，如果保存了旧 DOM 树，渲染器将会比较新旧 DOM 树，找出它们之间的区别，并应用这其中的变化到真实的 DOM 上。这个过程被称为更新 (patch)。

**为什么使用虚拟 DOM?**

- 真实 DOM 很慢，其元素非常庞大，页面的性能问题，大部分都是由 DOM 操作引起的。使用虚拟 DOM，当数据变化，页面需要更新时，通过 diff 算法比较新旧虚拟 dom，生成差异对象，一次性对 DOM 进行批量更新操作，**减少 JavaScript 操作真实 DOM 的带来的性能消耗**。
- 虚拟 DOM 本质上是 JavaScript 对象，和平台无关，可以进行**跨平台操作**，例如服务器渲染、安卓和 IOS 的原生组件、小程序等。

一个最简单的 div 也包含着很多属性：
<img src="./images/div-attrs.png" width="80%" />

### 3.2 diff 算法

diff 算法是一种通过同层的树节点进行比较的高效算法，有两个特点：

- 比较只会在同层级进行, 不会跨层级比较
- 在 diff 比较的过程中，循环从两边向中间比较

在 vue 中，diff 算法作用于响应式数据更新后，新旧 VNode 节点的比较，然后将变化的部分更新到视图上。

<img src="./images/vnode-diff.png" width="60%" />

#### 1) patch

当数据发生改变时，set 方法会让调用 Dep.notify 通知所有订阅者 Watcher，Watcher 就会调用 patch 给真实的 DOM 打补丁，更新相应的视图。

- 如果没有新节点，直接销毁旧节点
- 如果没有旧节点，直接创建新节点
- 如果旧节点和新节点是同一个节点，执行 `patchVnode`，否则直接销毁旧节点，创建新节点
  - 同一个节点：key 相同，且 tag 相同，且是否为注释节点相同，且属性是否为空相同，且如果是 `<input>` type 相同等

```javascript
function patch(oldVnode, vnode, hydrating, removeOnly) {
  // 没有新节点，直接销毁旧节点，执行 destory 钩子函数
  if (isUndef(vnode)) {
    if (isDef(oldVnode)) invokeDestroyHook(oldVnode);
    return;
  }

  let isInitialPatch = false;
  const insertedVnodeQueue: any[] = [];

  if (isUndef(oldVnode)) {
    // 没有旧节点，直接创建新节点
    isInitialPatch = true;
    createElm(vnode, insertedVnodeQueue);
  } else {
    if (sameVnode(oldVnode, vnode)) {
      // 如果旧节点和新节点是同一个节点，执行 patchVnode
      patchVnode(oldVnode, vnode, insertedVnodeQueue, null, null, removeOnly);
    } else {
      // 否则直接销毁旧节点，创建新节点
      const oldElm = oldVnode.elm;
      const parentElm = nodeOps.parentNode(oldElm);

      // create new node
      createElm(vnode, insertedVnodeQueue, oldElm._leaveCb ? null : parentElm, nodeOps.nextSibling(oldElm));

      // destroy old node
      if (isDef(parentElm)) {
        removeVnodes([oldVnode], 0, 0);
      } else if (isDef(oldVnode.tag)) {
        invokeDestroyHook(oldVnode);
      }
    }

    invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch);
    return vnode.elm;
  }
}
```

```javascript
function sameVnode(a, b) {
  return (
    a.key === b.key &&
    a.asyncFactory === b.asyncFactory &&
    ((a.tag === b.tag && a.isComment === b.isComment && isDef(a.data) === isDef(b.data) && sameInputType(a, b)) ||
      (isTrue(a.isAsyncPlaceholder) && isUndef(b.asyncFactory.error)))
  );
}
```

#### 2) patchVnode

如果认为新旧节点是同一个节点，会通过 patchVnode 比较两个节点。

- 如果新旧节点指向同一对象，返回
- 如果新节点不是文本节点
  - 如果新旧节点都有子节点且不相等，通过 `updateChildren` 来更新子节点
  - 如果新节点有子节点，旧节点没有子节点，先清空旧节点的文本内容，然后新增子节点
  - 如果新节点没有子节点，旧节点有子节点，移除所有子节点
  - 如果旧节点是文本节点，清空文本内容
- 如果新节点是文本节点
  - 新旧节点文本不相等，更新文本

```javascript
function patchVnode(oldVnode, vnode, insertedVnodeQueue, ownerArray, index, removeOnly?: any) {
  // 如果新旧节点指向同一对象，返回
  if (oldVnode === vnode) {
    return;
  }

  if (isDef(vnode.elm) && isDef(ownerArray)) {
    // clone reused vnode
    vnode = ownerArray[index] = cloneVNode(vnode);
  }

  // 找到对应的真实 DOM，称为 elm
  // 让 vnode.elm 引用到现在的真实 DOM，当 elm 修改时，vnode.elm 会同步变化
  const elm = (vnode.elm = oldVnode.elm);

  // 异步占位符节点
  if (isTrue(oldVnode.isAsyncPlaceholder)) {
    if (isDef(vnode.asyncFactory.resolved)) {
      hydrate(oldVnode.elm, vnode, insertedVnodeQueue);
    } else {
      vnode.isAsyncPlaceholder = true;
    }
    return;
  }

  // 跳过静态节点
  // 新旧节点都是静态的，且具有相同的 key，且新节点是克隆节点或是 v-once 指令控制的节点时，则复用这部分节点
  if (
    isTrue(vnode.isStatic) &&
    isTrue(oldVnode.isStatic) &&
    vnode.key === oldVnode.key &&
    (isTrue(vnode.isCloned) || isTrue(vnode.isOnce))
  ) {
    vnode.componentInstance = oldVnode.componentInstance;
    return;
  }

  const oldCh = oldVnode.children;
  const ch = vnode.children;
  if (isDef(data) && isPatchable(vnode)) {
    for (i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode);
    if (isDef((i = data.hook)) && isDef((i = i.update))) i(oldVnode, vnode);
  }

  // patch 过程
  if (isUndef(vnode.text)) {
    // 如果新节点不是文本节点
    if (isDef(oldCh) && isDef(ch)) {
      // 1. 新旧节点都有子节点，且子节点不相等，调用 updateChildren
      if (oldCh !== ch) updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly);
    } else if (isDef(ch)) {
      // 2. 新节点有子节点，旧节点没有子节点，先清空旧节点的文本内容，然后新增子节点
      if (__DEV__) {
        checkDuplicateKeys(ch);
      }
      if (isDef(oldVnode.text)) nodeOps.setTextContent(elm, "");
      addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
    } else if (isDef(oldCh)) {
      // 3. 新节点没有子节点，旧节点有子节点，移除所有子节点
      removeVnodes(oldCh, 0, oldCh.length - 1);
    } else if (isDef(oldVnode.text)) {
      // 4. 旧节点是文本节点，清空文本内容
      nodeOps.setTextContent(elm, "");
    }
  } else if (oldVnode.text !== vnode.text) {
    // 新节点是文本节点，且文本不相等，更新文本
    nodeOps.setTextContent(elm, vnode.text);
  }
}
```

#### 3) updateChildren

新旧 VNode 节点如下图所示：

<img src="./images/vnode-diff-0.png" width="60%" />

第一次循环，发现旧节点 D 与新节点 D 相同，将旧节点 D 插入到旧的起始节点之前，oldEndIdx--，newStartIdx++。

<img src="./images/vnode-diff-1.png" width="60%" />

第二次循环，发现旧节点 C 与新节点 C 相同，将旧节点 C 插入到旧的起始节点之前，oldEndIdx--，newStartIdx++。

<img src="./images/vnode-diff-2.png" width="60%" />

第三次循环中，发现 E 节点没有找到，直接创建新的真实节点 E，插入到旧的起始节点之前，newStartIdx++。

<img src="./images/vnode-diff-3.png" width="60%" />

第四次循环、第五次循环中，发现了新旧节点的开头相同，直接复用 A、B 节点，oldStartIdx++，newStartIdx++。

<img src="./images/vnode-diff-4.png" width="60%" />

此时，oldStartIdx > oldEndIdx，创建 newStartIdx 和 newEndIdx 之间的所有节点，插入父节点的子节点后面

<img src="./images/vnode-diff-5.png" width="60%" />

- 将新旧节点的 start 或 end 两两比较，如果有相同节点，直接 patchVnode，根据情况挪动旧节点，并且调整索引
- 如果首尾没有相同节点可以复用，
  - 根据 oldChild 的 key 生成一张 `key-index` hash 表，查找与 newStartVnode 一致 key 的旧的 VNode 节点
  - 如果未找到，或者找到了相同 key 的节点，但是不是同一个节点，创建一个新的节点插入至 oldStartVnode 前面
  - 如果找到了相同 key 且是同一个节点，移动该节点至 oldStartVnode 前面，将该节点清空

key 的作用：不设 key，newCh 和 oldCh 只会进行头尾的两两比较，设 key 后，还会从 `key-index` 的哈希表中查找匹配的节点，可以更高效的利用 dom。

```javascript
function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue, removeOnly) {
  let oldStartIdx = 0;
  let newStartIdx = 0;
  let oldEndIdx = oldCh.length - 1;
  let oldStartVnode = oldCh[0];
  let oldEndVnode = oldCh[oldEndIdx];
  let newEndIdx = newCh.length - 1;
  let newStartVnode = newCh[0];
  let newEndVnode = newCh[newEndIdx];
  let oldKeyToIdx, idxInOld, vnodeToMove, refElm;

  // removeOnly是一个特殊的标志，仅由 <transition-group> 使用，以确保被移除的元素在离开转换期间保持在正确的相对位置
  const canMove = !removeOnly;

  if (__DEV__) {
    // 检查新节点的 key 是否重复
    checkDuplicateKeys(newCh);
  }

  // 遍历新旧两组节点，只要开始索引大于结束索引，则跳出循环
  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (isUndef(oldStartVnode)) {
      // 1. 如果旧节点的第一个 child 不存在，oldStart 索引右移
      oldStartVnode = oldCh[++oldStartIdx]; // Vnode has been moved left
    } else if (isUndef(oldEndVnode)) {
      // 2. 如果旧节点的最后一个 child 不存在，oldEnd 索引左移
      oldEndVnode = oldCh[--oldEndIdx];
    } else if (sameVnode(oldStartVnode, newStartVnode)) {
      // 3. oldStartVnode 和 newStartVnode 是同一个节点，patch 它们，索引左移，继续循环
      patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue, newCh, newStartIdx);
      oldStartVnode = oldCh[++oldStartIdx];
      newStartVnode = newCh[++newStartIdx];
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      // 4. oldEndVnode 和 newEndVnode 是同一个节点，patch 它们，索引右移，继续循环
      patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx);
      oldEndVnode = oldCh[--oldEndIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldStartVnode, newEndVnode)) {
      // 5. oldStartVnode 和 newEndVnode 是同一个节点，patch 它们，
      patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx);
      // 将 oldStartVnode.elm 移动到 oldEndVnode.elm 之后
      canMove && nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm));
      // oldStart 索引右移，newEnd 索引左移
      oldStartVnode = oldCh[++oldStartIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldEndVnode, newStartVnode)) {
      // 6. 如果 oldEndVnode 和 newStartVnode 是同一个节点，patch 它们，
      patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue, newCh, newStartIdx);
      // 将 oldEndVnode.elm 移动到 oldStartVnode.elm 之前
      canMove && nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
      // oldEnd 索引左移，newStart 索引右移
      oldEndVnode = oldCh[--oldEndIdx];
      newStartVnode = newCh[++newStartIdx];
    } else {
      // 7. 如果以上的两两比较都不匹配

      if (isUndef(oldKeyToIdx)) oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
      // 尝试在 oldChildren 中寻找和 newStartVnode 的具有相同的 key 的 Vnode
      idxInOld = isDef(newStartVnode.key)
        ? oldKeyToIdx[newStartVnode.key]
        : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx);

      if (isUndef(idxInOld)) {
        // 如果未找到，说明 newStartVnode 是一个新的节点，创建一个新Vnode
        createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx);
      } else {
        // 如果找到了和 newStartVnode 具有相同的 key 的 Vnode，叫 vnodeToMove
        vnodeToMove = oldCh[idxInOld];
        if (sameVnode(vnodeToMove, newStartVnode)) {
          // 如果两个具有相同的 key 的节点是同一个节点，patch 他们
          patchVnode(vnodeToMove, newStartVnode, insertedVnodeQueue, newCh, newStartIdx);
          // 清除旧节点
          oldCh[idxInOld] = undefined;
          // 将 vnodeToMove.elm 移动到 oldStartVnode.elm 之前
          canMove && nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm);
        } else {
          // same key but different element. treat as new element
          createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx);
        }
      }
      newStartVnode = newCh[++newStartIdx];
    }
  }
  if (oldStartIdx > oldEndIdx) {
    // 旧节点被遍历完了，新节点有剩余，添加这些新节点
    refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm;
    addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
  } else if (newStartIdx > newEndIdx) {
    // 新节点被遍历完了，旧节点有剩余，移除这些旧节点
    removeVnodes(oldCh, oldStartIdx, oldEndIdx);
  }
}
```

## 4. nextTick 原理

### 4.1 Vue DOM 的异步更新

原生 DOM 的修改是同步的，渲染是异步的，渲染的顺序是 Task -> MicroTask -> UI Render，即在微任务队列清空之后的浏览器刷新时重新渲染。

```html
<div id="div"></div>
<script>
  Promise.resolve().then(() => {
    console.log("promise");
  });
  var div = document.getElementById("div");
  // 同步修改 DOM
  div.innerHTML = "divInnerHTML";
  console.log(div.innerHTML);
  // divInnerHTML
  // promise
</script>
```

当你在 Vue 中更改响应式状态时，DOM 更新并不是同步生效的，即使数据多次变化，但 DOM 只会更新一次。

因为如果同步进行 DOM 更新，则每次对响应式数据进行修改就都会触发 setter -> 通知 watcher -> 触发 re-render -> 生成 new vnode(vdom) -> patch（更新真实 DOM），非常消耗性能。

1. 侦听到数据变化，Vue 将开启一个队列，缓存同一事件循环中的所有 Watcher；
2. 如果有同一个 Watcher，只推入队列一次，避免不必要的计算和 DOM 操作；
3. 如果 flushing 为 false，就调用 nextTick 将 DOM 更新函数 flushSchedulerQueue 添加至微任务队列。之后如果有其它待更新 Watcher，也会继续添加至 queue 数组（闭包），flushSchedulerQueue 执行时会一起更新。
4. 同步任务执行完毕，开始执行微任务，包括异步 Watcher 队列的任务，一次性更新 DOM。

注意：这里说的 DOM 都是更新，不是渲染。

```javascript
/** Vue DOM更新简化版源码 */

// 定义watcher类
class Watcher {
  update() {
    // 放到 watcher 队列中，异步更新
    queueWatcher(this);
  }
  // 触发更新
  run() {
    this.get();
  }
}

// 保存 watcher 的队列
const queue: Array<Watcher> = [];
// 保存 watcher 的 id，进行去重操作
let has: { [key: number]: true | undefined | null } = {};
// 如果异步队列正在执行，将不会再次执行
let flushing = false;

// 队列中添加 watcher
function queueWatcher(watcher) {
  const id = watcher.id;
  // 先判断 watcher 是否存在，去掉重复的 watcher
  if (!has[id]) {
    queue.push(watcher);
    has[id] = true;
    if (!flushing) {
      flushing = true;
      // 使用异步更新 watcher
      nextTick(flushSchedulerQueue);
    }
  }
}

// 执行 watcher 队列的任务
function flushSchedulerQueue() {
  queue.forEach((watcher) => {
    watcher.run();
    if (watcher.options.render) {
      // 在更新之后执行对应的回调，这里是 updated 钩子函数
      watcher.cb();
    }
  });
  // 执行完成后清空队列，重置 flushing 状态
  queue = [];
  has = {};
  flushing = false;
}
```

### 4.2 nextTick 原理

nextTick() 可以在数据修改后立即使用，以获取 DOM 更新后的状态。

- 判断当前环境优先支持的异步方法，优先选择微任务，优先级：Promise、MutationObserver、setImmediate、setTimeout。
- setTimeout 可能产生一个 4ms 的延迟，而 setImmediate 会在主线程执行完后立刻执行，setImmediate 在 IE10 和 node 中支持。

nextTick 的实质是 MicroTask。数据更新时，会调用 nextTick 将 DOM 更新代码`watcher.run();`添加至微任务；如果我们在数据更新后面调用 nextTick，也会添加至微任务队列，因为 DOM 的更新是同步的，就能获取到最新 DOM 了。

```javascript
// noop 表示一个无操作空函数，用作函数默认值，防止传入 undefined 导致报错
import { noop } from 'shared/util'
// handleError 错误处理函数
import { handleError } from './error'
// isIE, isIOS环境判断函数，
// isNative 判断某个属性或方法是否原生支持，如果不支持或通过第三方实现支持都会返回 false
import { isIE, isIOS, isNative } from './env'

// 标记 nextTick 最终是否以微任务执行
export let isUsingMicroTask = false

// 存放调用 nextTick 时传入的回调函数
const callbacks: Array<Function> = []
// 标记是否已经向任务队列中添加了一个任务，如果已经添加了就不能再添加了
// 当向任务队列中添加了任务时，将 pending 置为 true，当任务被执行后将 pending 置为 false
let pending = false

// 如果多次调用 nextTick，将 nextTick 的回调放在 callbacks 数组中
// 最后通过 flushCallbacks 函数遍历 callbacks 数组的拷贝并执行其中的回调
function flushCallbacks() {
  pending = false
  // 为什么要拷贝一份 callbacks？
  // 在 nextTick 回调中可能还会调用 nextTick，又会向 callbacks 中添加回调，
  // nextTick 回调中的 nextTick 应该放在下一轮执行，否则就可能出现一直循环的情况
  const copies = callbacks.slice(0) // 拷贝一份 callbacks
  callbacks.length = 0 // 清空 callbacks
  for (let i = 0; i < copies.length; i++) { // 遍历执行传入的回调
    copies[i]()
  }
}

let timerFunc

/* istanbul ignore next, $flow-disable-line */
if (typeof Promise !== 'undefined' && isNative(Promise)) {
  // 判断当前环境是否原生支持 promise

  const p = Promise.resolve()
  timerFunc = () => {
    // 用 promise.then 把 flushCallbacks 函数包裹成一个异步微任务
    p.then(flushCallbacks)
    // 这里的 setTimeout 是用来强制刷新微任务队列的
    // 因为在 ios 下 promise.then 后面没有宏任务的话，微任务队列不会刷新
    if (isIOS) setTimeout(noop)
  }
  // 标记当前 nextTick 使用的微任务
  isUsingMicroTask = true
} else if (
  !isIE &&
  typeof MutationObserver !== 'undefined' &&
  (isNative(MutationObserver) ||
    // PhantomJS and iOS 7.x
    MutationObserver.toString() === '[object MutationObserverConstructor]')
) {
  // 如果不支持 promise，就判断是否支持 MutationObserver
  // 不是IE环境，并且原生支持 MutationObserver，那也是一个微任务

  let counter = 1
  // new 一个 MutationObserver 类
  const observer = new MutationObserver(flushCallbacks)
  // 创建一个文本节点
  const textNode = document.createTextNode(String(counter))
  // 监听这个文本节点，当数据发生变化就执行 flushCallbacks
  observer.observe(textNode, {
    characterData: true
  })
  timerFunc = () => {
    counter = (counter + 1) % 2
    textNode.data = String(counter) // 数据更新
  }

  // 标记当前 nextTick 使用的微任务
  isUsingMicroTask = true
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  // 判断当前环境是否原生支持 setImmediate

  timerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else {
  // 以上三种都不支持就选择 setTimeout

  timerFunc = () => {
    setTimeout(flushCallbacks, 0)
  }
}

// 声明 nextTick 函数，接收一个回调函数和一个执行上下文作为参数
// 回调的 this 自动绑定到调用它的实例上
export function nextTick(): Promise<void>
export function nextTick<T>(this: T, cb: (this: T, ...args: any[]) => any): void
export function nextTick<T>(cb: (this: T, ...args: any[]) => any, ctx: T): void
/**
 * @internal
 */
export function nextTick(cb?: (...args: any[]) => any, ctx?: object) {
  let _resolve
  // 将传入的回调函数存放到数组中，后面会遍历执行其中的回调
  callbacks.push(() => {
    if (cb) {
      try {
        cb.call(ctx)
      } catch (e: any) {
        handleError(e, ctx, 'nextTick')
      }
    } else if (_resolve) {
      _resolve(ctx)
    }
  })
  // 如果当前没有在 pending 的回调，就执行 timeFunc 函数选择当前环境优先支持的异步方法
  // 当在同一轮事件循环中多次调用 nextTick 时，timerFunc 只会执行一次
  if (!pending) {
    pending = true
    timerFunc()
  }
  // 如果没有传入回调，并且当前环境支持 promise，就返回一个 promise，在返回的这个 promise.then 中 DOM 已经更新好了
  // $flow-disable-line
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(resolve => {
      _resolve = resolve
    })
  }
}
```

### 4.3 例题

在 nextTick 之前，有状态修改语句，才会把 DOM 修改函数加入微任务队列；否则，会把我们定义的 nextTick 先加入微任务队列。

```javascript
<template>
  <div>
    <p class="name">{{ name }}</p>
    <p class="age">{{ age }}</p>
    <button @click="modify">修改</button>
  </div>
</template>
<script>
export default {
  data() {
    return {
      name: "111",
      age: 16,
    };
  },
  methods: {
    modify() {
      this.name = "222"; // 关键的赋值语句，如果注释掉，打印 111 和 16
      this.$nextTick(() => {
        const name = document.querySelector(".name").innerText;
        console.log(name); // 333
        const age = document.querySelector(".age").innerText;
        console.log(age); // 20
      });
      this.name = "333";
      this.age = 20;
    },
  },
};
</script>
```

## 5. keep-alive 原理

### 5.1 什么是 keep-alive

可以用 `<keep-alive>` 元素将动态组件包裹起来，包裹的组件实例在它们第一次被创建时被缓存，组件切换后也不会被销毁，防止重复渲染 DOM。

`<keep-alive>` 有以下三个属性：

- `include`：字符串或正则表达式，只有名称匹配的组件会被缓存。
- `exclude`：字符串或正则表达式，任何名称匹配的组件都不会被缓存。
- `max`：数字，最多可以缓存多少个组件实例。

```html
<keep-alive>
  <component :is="view"></component>
</keep-alive>

<keep-alive include="a,b">
  <component :is="view"></component>
</keep-alive>
```

`<keep-alive>` 包裹组件的生命周期：

- `activated`：被 `<keep-alive>` 缓存的组件激活时调用。
- `deactivated`：被 `<keep-alive>` 缓存的组件停用时调用。

设置了 `keep-alive` 缓存的组件的生命周期：

- 首次进入组件时：beforeRouteEnter > beforeCreate > created > mounted > activated > ... ... > beforeRouteLeave > deactivated
- 再次进入组件时：beforeRouteEnter > activated > ... ... > beforeRouteLeave > deactivated

### 5.2 keep-alive 原理

`keep-alive`是 vue 中内置的一个组件。

1. 该组件没有 template，而是用了 render，在组件渲染的时候会自动执行 render 函数。
2. 通过插槽 `this.$slots` 获取包裹的组件的 vnode，获取第一个子组件，只对第一个子组件有效
3. 判断组件的 name 是否在 include 或 exclude 中，确认该组件是否需要缓存
4. 如果需要缓存，通过组件的 key 或者 cid+tag 判断，该组件是否有缓存

- 如果有缓存，返回缓存，更新 LRU 队列
- 如果没有缓存，进入 mounted 或 updated 生命周期，设置缓存，在 LRU 队列新增组件 key，如果 max 已满，删除最老的组件 key

```typescript
// src/core/components/keep-alive.js

export default {
  name: "keep-alive",
  abstract: true,

  props: {
    include: patternTypes,
    exclude: patternTypes,
    max: [String, Number],
  },

  methods: {
    cacheVNode() {
      const { cache, keys, vnodeToCache, keyToCache } = this;
      if (vnodeToCache) {
        const { tag, componentInstance, componentOptions } = vnodeToCache;
        cache[keyToCache] = {
          name: _getComponentName(componentOptions),
          tag,
          componentInstance,
        };
        keys.push(keyToCache);
        // prune oldest entry
        if (this.max && keys.length > parseInt(this.max)) {
          pruneCacheEntry(cache, keys[0], keys, this._vnode);
        }
        this.vnodeToCache = null;
      }
    },
  },

  created() {
    this.cache = Object.create(null);
    this.keys = [];
  },

  destroyed() {
    for (const key in this.cache) {
      pruneCacheEntry(this.cache, key, this.keys);
    }
  },

  mounted() {
    this.cacheVNode();
    this.$watch("include", (val) => {
      pruneCache(this, (name) => matches(val, name));
    });
    this.$watch("exclude", (val) => {
      pruneCache(this, (name) => !matches(val, name));
    });
  },

  updated() {
    this.cacheVNode();
  },

  render() {
    // 获取默认插槽中的第一个组件节点
    const slot = this.$slots.default;
    const vnode = getFirstComponentChild(slot);
    // 获取该组件节点的 componentOptions
    const componentOptions = vnode && vnode.componentOptions;
    if (componentOptions) {
      // 获取该组件节点的名称，优先获取组件的 name 字段，如果 name 不存在则获取组件的 tag
      const name = _getComponentName(componentOptions);
      const { include, exclude } = this;
      // 如果 name 不在 inlcude 中或者存在于 exlude 中，则表示不缓存，直接返回 vnode
      if (
        // not included
        (include && (!name || !matches(include, name))) ||
        // excluded
        (exclude && name && matches(exclude, name))
      ) {
        return vnode;
      }

      const { cache, keys } = this;
      // 获取组件的 key 值
      const key =
        vnode.key == null
          ? componentOptions.Ctor.cid + (componentOptions.tag ? `::${componentOptions.tag}` : "")
          : vnode.key;
      if (cache[key]) {
        // 该组件有缓存
        vnode.componentInstance = cache[key].componentInstance;
        // 调整该组件 key 的顺序，将其从原来的地方删掉并重新放在最后一个，LRU 算法
        // make current key freshest
        remove(keys, key);
        keys.push(key);
      } else {
        // 如果没有缓存，则将其设置进缓存，进入 mounted 或 updated
        // delay setting the cache until update
        this.vnodeToCache = vnode;
        this.keyToCache = key;
      }

      // @ts-expect-error can vnode.data can be undefined
      vnode.data.keepAlive = true;
    }
    return vnode || (slot && slot[0]);
  },
};
```

在 mounted 钩子函数中观测 include 和 exclude 的变化，如果二者发生了变化，表示需要缓存或不缓存组件的规则发生了变化，那么就执行 pruneCache 函数。

pruneCache 函数对 cache 对象进行遍历，取出每一项的 name 值，用其与新的缓存规则进行匹配，如果匹配不上，则表示在新的缓存规则下该组件已经不需要被缓存，则调用 pruneCacheEntry 函数将其从 cache 对象剔除即可。

```javascript
function pruneCache() {
  const { cache, keys, _vnode, $vnode } = keepAliveInstance;
  for (const key in cache) {
    const entry = cache[key];
    if (entry) {
      const name = entry.name;
      // 如果该组件已经不需要缓存
      if (name && !filter(name)) {
        pruneCacheEntry(cache, key, keys, _vnode);
      }
    }
  }
  $vnode.componentOptions!.children = undefined;
}

// 从 cache 对象中删除 key 属性
function pruneCacheEntry() {
  const entry = cache[key]
  if (entry && (!current || entry.tag !== current.tag)) {
    entry.componentInstance.$destroy()
  }
  cache[key] = null
  remove(keys, key)
}
```

### 5.3 LRU 缓存策略

LRU（least recently used）缓存策略 ∶ 从内存中找出最久未使用的数据进行清除。因为如果数据最近被访问过，那么将来再次被访问的几率也更高。

在实现 `keep-alive` 时，使用 cache 对象保存 `key-组件` ，使用 keys 数组保存最近访问数据的 key。

- keys 数组最前面是最久未使用数据的 key，最后面是最新访问数据的 key
- 如果有新访问的组件，把该组件的 key push 至 keys，如果 `keys.length > max`，移除 keys[0]
- 如果访问已缓存的组件，从 keys 中找到该组件的 key，删除，在末尾 push 该组件的 key

## 6. css scoped 原理

1. 编译时，会给每个 vue 文件生成一个唯一的 id，将此 id 添加到当前文件中所有 html 的标签上
2. 编译 style 标签时，会将 css 选择器改造成属性选择器

```html
<!-- 编译前：<div class="test-attr">属性选择器</div> -->
<div data-v-27e4e96e class="test-attr">属性选择器</div>
<style>
  /* 编译前：.test-attr { color: red; } */
  .test-attr[data-v-27e4e96e] {
    color: red;
  }
</style>
<script>
  // 通过 js 判断是否存在 data-v-27e4e96e 属性
  console.log(document.querySelector(".test-attr").getAttribute("data-v-27e4e96e") === ""); // true
</script>
```

参考文章：

[Vue.js 源码分析](https://github.com/ustbhuangyi/vue-analysis)
