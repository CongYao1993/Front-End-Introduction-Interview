import{_ as l,c as e,o as i,b as s}from"./app-CPcPz2RP.js";const t={},o=s('<h2 id="_1-xss-跨站脚本攻击" tabindex="-1"><a class="header-anchor" href="#_1-xss-跨站脚本攻击"><span>1. XSS 跨站脚本攻击</span></a></h2><p><a href="https://tech.meituan.com/2018/09/27/fe-security.html" target="_blank" rel="noopener noreferrer">前端安全系列（一）：如何防止 XSS 攻击？</a></p><p>跨站脚本攻击（Cross Site Scripting，XSS）：攻击者在页面注入恶意 JavaScript 代码，使之在用户的浏览器运行。</p><h3 id="_1-1-xss-攻击方式" tabindex="-1"><a class="header-anchor" href="#_1-1-xss-攻击方式"><span>1.1 XSS 攻击方式</span></a></h3><ul><li>攻击者<strong>将恶意代码提交到目标网站的数据库中</strong>（存储型 XSS），用户打开目标网站收到响应后，恶意代码也被解析执行。 <ul><li>这种攻击常见于带有用户提交数据的网站功能，如论坛发帖、商品评论、用户私信等。</li></ul></li><li>攻击者<strong>构造出包含恶意代码的 URL</strong>，并诱导用户点击； <ul><li>反射型：网站服务端将恶意代码从 URL 中取出，拼接在 HTML 中返回给客户端，在客户端被解析执行；</li><li>DOM 型：客户端收到服务器响应后解析执行，前端 JavaScript 取出 URL 中的恶意代码并执行。</li><li>这种攻击常见于通过 URL 传递参数的功能，如网站搜索、跳转等。</li></ul></li></ul><h3 id="_1-2-xss-的危害" tabindex="-1"><a class="header-anchor" href="#_1-2-xss-的危害"><span>1.2 XSS 的危害</span></a></h3><ul><li>通过 <code>document.cookie</code>，窃取 Cookie</li><li>劫持流量，实现恶意跳转</li></ul><h3 id="_1-3-xss-的预防" tabindex="-1"><a class="header-anchor" href="#_1-3-xss-的预防"><span>1.3 XSS 的预防</span></a></h3><ul><li>输入过滤：对<code>&lt;script&gt;</code>、<code>&lt;img&gt;</code>、<code>&lt;a&gt;</code>等标签进行过滤；</li><li>输入限制：对输入内容长度限制或输入内容格式限制（比如数字、电话号码、邮箱等）</li><li>转义 HTML：如果拼接 HTML 是必要的，就需要采用合适的转义库，对 HTML 模板各处插入点进行充分的转义。</li><li>纯前端渲染： <ul><li>类似于 SPA 应用。浏览器先加载一个静态 HTML，此 HTML 中不包含任何跟业务相关的数据；然后浏览器执行 HTML 中的 JavaScript；JavaScript 通过 Ajax 加载业务数据，调用 DOM API 更新到页面上。</li><li>在纯前端渲染中，会明确设置的内容是文本、属性、样式等。即使数据中包含<code>&lt;script&gt;</code>，也会被当作纯文本渲染。</li><li>但纯前端渲染还需注意避免 DOM 型 XSS 漏洞（例如 onload 事件和 href 中的 javascript:xxx 等。</li></ul></li></ul><p>Vue 中如何防止 XSS：</p><ul><li>Vue 中使用<code>{{ }}</code>模板渲染数据或通过 <code>v-bind</code> 给元素绑定属性时，都已将内容转义；</li><li>尽量避免使用 <code>v-html</code>，如果必须使用，可以使用 vue-xss 插件对文本内容进行转义，该插件可以同时去掉上面绑定的事件</li></ul><h2 id="_2-csrf-跨站请求伪造" tabindex="-1"><a class="header-anchor" href="#_2-csrf-跨站请求伪造"><span>2. CSRF 跨站请求伪造</span></a></h2><p><a href="https://tech.meituan.com/2018/10/11/fe-security-csrf.html" target="_blank" rel="noopener noreferrer">前端安全系列（二）：如何防止 CSRF 攻击？</a></p><p>跨站请求伪造（Cross-Site Request Forgery，CSRF）：攻击者诱导受害者进入钓鱼网站，在钓鱼网站中，利用你在被攻击网站已登录的凭证，冒充用户发送恶意请求。</p><h3 id="_1-1-csrf-攻击方式" tabindex="-1"><a class="header-anchor" href="#_1-1-csrf-攻击方式"><span>1.1 CSRF 攻击方式</span></a></h3><p><strong>CSRF 攻击过程：</strong></p><ol><li>受害者登录 A 站点，并保留了登录凭证（Cookie）；</li><li>攻击者引诱受害者访问了 B 站点（钓鱼网站），B 站点 获取到了登录凭证；</li><li>B 站点 向 A 站点 发送了一个请求，该请求携带登录凭证；</li><li>A 站点接收到请求后，对请求进行验证，并确认是受害者的凭证，误以为是受害者自己发送的请求；</li><li>A 站点以受害者的名义执行了请求，攻击完成，攻击者在受害者不知情的情况下，冒充受害者，让 A 站点执行了自己定义的操作。</li></ol><p>要完成一次 CSRF 攻击，受害者必须依次完成以下两个步骤：</p><ol><li>登录受信任网站 A，并在本地生成 Cookie。</li><li>在不登出 A 的情况下，访问危险网站 B。</li></ol><p><strong>CSRF 攻击方式：</strong></p><ul><li>GET 类型的 CSRF：在 B 站点插入一个<code>&lt;img&gt;</code>，将其 src 属性设置为 A 站点的链接（比如一个支付链接），如果用户在登录 A 站点的情况下，访问 B 站点，B 站点就会获取 A 站点的 Cookie 并发送恶意跨站请求</li><li>POST 类型的 CSRF：利用一个自动提交的表单进行跨站请求</li><li>链接类型的 CSRF：通过<code>&lt;a&gt;</code>的 href 发送恶意请求，需要诱导用户触发</li></ul><p>三者都是发起跨站请求，只是发起请求的方式不同。</p><h3 id="_1-2-csrf-防御" tabindex="-1"><a class="header-anchor" href="#_1-2-csrf-防御"><span>1.2 CSRF 防御</span></a></h3><ul><li>阻止不明外域的访问，因为 CSRF 通常发生在第三方域名 <ul><li><strong>同源检测</strong>：通过请求头 Origin 或 Referer 判断请求来源，如果不在请求域名白名单中，就拒绝请求</li><li><strong>Cookie 的 Samesite 属性</strong>：<code>Set-Cookie: Samesite=None</code>。 <ul><li>如果 Samesite 被设置为 Strict，这个 Cookie 在任何情况下都不可能作为第三方 Cookie，浏览器在任何跨域请求中都不会携带 Cookie，重新打开新标签或者跳转子域名也不携带，所以说 CSRF 攻击基本没有机会，但是用户体验不好。</li><li>如果 Samesite 被设置为 None， 浏览器会在同站请求和跨站请求下继续发送 cookie，但仅在安全的上下文中（必须设置 Secure 属性）。</li></ul></li></ul></li><li>提交时要求附加本域才能获取的信息，因为攻击者不能获取到 Cookie 等信息，只是使用。 <ul><li><strong>添加 token 验证</strong>：所有的用户请求都携带一个攻击者无法获取到的 token，服务器通过校验请求是否携带正确的 token，防范 CSRF 的攻击。</li><li><strong>验证码</strong>：强制用户必须与应用进行交互，才能完成最终请求，比如支付环节</li></ul></li></ul><h2 id="_3-中间人攻击" tabindex="-1"><a class="header-anchor" href="#_3-中间人攻击"><span>3. 中间人攻击</span></a></h2><p>中间人攻击过程如下：</p><ol><li>客户端向服务器发送建立连接的请求</li><li>服务器向客户端发送公钥</li><li>攻击者截获公钥，保留在自己手上，生成一个伪造的公钥，发给客户端</li><li>客户端收到伪造的公钥后，生成加密的秘钥值发给服务器</li><li>攻击者获得加密秘钥，用自己的私钥解密获得秘钥，同时生成假的加密秘钥，发给服务器</li><li>服务器用私钥解密获得假秘钥，服务器用假秘钥加密传输信息</li></ol><p>防范方法：服务端在发送浏览器的公钥中加入 CA 证书，浏览器可以验证 CA 证书的有效性</p>',28),r=[o];function a(n,c){return i(),e("div",null,r)}const d=l(t,[["render",a],["__file","网络安全.html.vue"]]),S=JSON.parse('{"path":"/interview/%E6%B5%8F%E8%A7%88%E5%99%A8%E4%B8%8E%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/%E7%BD%91%E7%BB%9C%E5%AE%89%E5%85%A8.html","title":"","lang":"zh-CN","frontmatter":{},"headers":[{"level":2,"title":"1. XSS 跨站脚本攻击","slug":"_1-xss-跨站脚本攻击","link":"#_1-xss-跨站脚本攻击","children":[{"level":3,"title":"1.1 XSS 攻击方式","slug":"_1-1-xss-攻击方式","link":"#_1-1-xss-攻击方式","children":[]},{"level":3,"title":"1.2 XSS 的危害","slug":"_1-2-xss-的危害","link":"#_1-2-xss-的危害","children":[]},{"level":3,"title":"1.3 XSS 的预防","slug":"_1-3-xss-的预防","link":"#_1-3-xss-的预防","children":[]}]},{"level":2,"title":"2. CSRF 跨站请求伪造","slug":"_2-csrf-跨站请求伪造","link":"#_2-csrf-跨站请求伪造","children":[{"level":3,"title":"1.1 CSRF 攻击方式","slug":"_1-1-csrf-攻击方式","link":"#_1-1-csrf-攻击方式","children":[]},{"level":3,"title":"1.2 CSRF 防御","slug":"_1-2-csrf-防御","link":"#_1-2-csrf-防御","children":[]}]},{"level":2,"title":"3. 中间人攻击","slug":"_3-中间人攻击","link":"#_3-中间人攻击","children":[]}],"git":{"updatedTime":1723989556000,"contributors":[{"name":"yaocong","email":"cong1207@qq.com","commits":1}]},"filePathRelative":"interview/浏览器与计算机网络/网络安全.md"}');export{d as comp,S as data};
