import{_ as i,c as e,o,b as t}from"./app-CPcPz2RP.js";const a="/front-end-docs/assets/composition-options-Dod_zqY3.png",s={},l=t(`<h2 id="_1-vue3-简介" tabindex="-1"><a class="header-anchor" href="#_1-vue3-简介"><span>1. Vue3 简介</span></a></h2><p>Vue 是一款用于构建用户界面的 JavaScript 框架。</p><p>从 Vue2 到 Vue3，产品的边界发生变化：</p><ul><li>Vue2 专注给用户提供一个完整的 MVVM（模型 Model、视图 View、视图模型 View Model）框架，让数据和模型绑定；</li><li>Vue3 是一个专注视图层（View）渲染的框架，服务范围在缩小。 <ul><li>Vue3 不再是一个 MVVM 框架，并不是说设计程序不再使用 MVVM 架构，而是说 Vue3 专注于渲染，服务范围在缩小，我们可以使用任何架构。</li></ul></li></ul><p>Vue3 是根据数据渲染视图的函数，加上一些副作用。</p><ul><li>纯函数：计算数据返回 DOM；</li><li>副作用（effect）：网络请求、Cookie 操作、window 操作、绑定事件、浏览器历史、页面跳转等。</li></ul><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text" data-title="text"><pre class="language-text"><code><span class="line">UI/view = f(data) with effect[]</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><h2 id="_2-composition-api" tabindex="-1"><a class="header-anchor" href="#_2-composition-api"><span>2. Composition API</span></a></h2><h3 id="_2-1-options-api-与-composition-api" tabindex="-1"><a class="header-anchor" href="#_2-1-options-api-与-composition-api"><span>2.1 Options API 与 Composition API</span></a></h3><p>Vue2 采用的就是 <code>options API</code></p><ul><li>优点:易于学习和使用, 每个代码有着明确的位置 (例如: 数据放 data 中, 方法放 methods 中)</li><li>缺点: data、methods、computed 是分散的，不便于维护和复用；虽然可以通过 mixins 提取相同的逻辑，但是也并不是特别好维护</li></ul><p>Vue3 新增了 <code>composition API</code></p><ul><li>可以用函数的方式，更加优雅的组织代码，让相关功能的代码更加有序的组织在一起，大大的提升了 代码可读性 和 可维护性。</li></ul><img src="`+a+'" width="40%">',14),n=[l];function p(c,d){return o(),e("div",null,n)}const r=i(s,[["render",p],["__file","Vue3.html.vue"]]),m=JSON.parse('{"path":"/tutorial/Vue3.html","title":"","lang":"zh-CN","frontmatter":{},"headers":[{"level":2,"title":"1. Vue3 简介","slug":"_1-vue3-简介","link":"#_1-vue3-简介","children":[]},{"level":2,"title":"2. Composition API","slug":"_2-composition-api","link":"#_2-composition-api","children":[{"level":3,"title":"2.1 Options API 与 Composition API","slug":"_2-1-options-api-与-composition-api","link":"#_2-1-options-api-与-composition-api","children":[]}]}],"git":{"updatedTime":null,"contributors":[]},"filePathRelative":"tutorial/Vue3.md"}');export{r as comp,m as data};