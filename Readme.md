![module info](https://nodei.co/npm/@gm5/response.png?downloads=true&downloadRank=true&stars=true)

# @gm5/response

> `@gm5/response` 对Http的response进一步封装, 提供常用的API.

## 安装

```bash
npm install @gm5/response
```

## 使用

```javascript
import Response from '@gm5/response'
import http from 'http'

http
  .createServer((req, res) => {
    let response = new Response(req, res)

    // it eq. argument res
    console.log(response.res)

    response.set('content-type', 'text/html; charset=utf-8')
    response.end('hello world')
  })
  .listen(3000)
```

## API


### origin
> 返回原始的 request & response 对象.



### error(msg[, code])

* msg `<String>`
* code `<Number>` Http状态码 [可选]

> 在客户端(浏览器)上输出友好的错误信息格式

```javascript
response.error('This is the error code', 500) //
response.error(null, 500) // null/empty, it will call the statusText back
response.error('Page not Found', 404) //
response.error(new Error('Auth denied'), 401) //
```

### status(code)

* code `<Number>`

> 设置Http状态码

```javascript
response.setStatus(501) //
response.setStatus(200) //
```

### set(key[, val])

* key `<String>` | `<Object>`
* code `<String>` | `<Number>`

> 设置响应头, 属性字段名不区分大小写

**相同的字段会被覆盖.**
**`content-type`如果没有设置编码时, 会自动设置为utf8**

```javascript
response.set('content-type', 'text/html; charset=utf-8') //
response.set('content-type', 'text/html') // 等价于上面的

response.set({'content-type', 'text/html', foo: 'bar'[, ...]})
```

### append(key, val)

* key `<String>`
* code `<String>` | `<Number>`

> 设置响应头, 属性字段名不区分大小写。与`set()`的区别时, 这个不会覆盖相同的字段, 而是合并输出。

```javascript
response.append('name', 'foo')
response.append('name', 'bar') //客户端能同时看到foo和bar这2个值
```

### get(key)

* key `<String>`

> 获取即将要发送到客户端的头信息。

```javascript
response.set('name', 'foo')
response.get('name') // foo
```


### redirect(url[, f])

* url `<String>`
* f `<Boolean>` 是否永久重定向, 默认否

> 重定向url. 

```javascript
response.redirect('http://test.com/foo')
response.redirect('http://test.cn', true)
```

### location(url)

* url `<String>`

> 重定向url. 但这是使用前端的方式跳转的.

```javascript
response.location('http://test.com/foo')
response.location('/foo')
```

### render(data[, code])

* data `<String>` | `<Buffer>`
* code `<Number>` Http状态码, 默认200

> 以html形式渲染内容。每次请求只能调用1次。


```javascript
let html = fs.readFileSync('./index.html')
response.render(html) // send from a html file.

let txt = '<h1>hello world</h1>'
response.render(txt)

response.render("You're not able to here", 401) 
```

### sendfile(target, name)

* target `<String>` | `<Buffer>` 可以是文件路径, 可以是文本, 可以是Buffer
* name `<String>` 要保存的文件名

> 直接以附件形式响应, 作为文件下载功能.

```javascript
// 不推荐
let pic = fs.readFileSync('./boy.jpg')
response.sendfile(pic, 'a-little-boy.jpg') 

// 推荐使用
response.sendfile('./boy.jpg', 'a-little-boy.jpg') 

response.sendfile('blablabla', 'bb.txt') 
```



### send(code[, msg][, data][, callback])

* code `<Number>`  http状态码
* msg `<String>` 错误信息文本
* data `<Object>` 响应主体内容, 可以是任意格式
* callback `<String>` 以jsonp形式返回对应的callback名

> 向客户端输出一个json(p), 支持resful api。


```javascript
response.send(200, 'ok', { foo: 'bar' })
// client will get the content like
// '{"code": 200, "msg": "ok", "data": {"foo": "bar"}}'

response.send(200, 'success', { name: 'foo', age: 16 }, 'blabla')
// client will get the content like
// 'blabla({"code": 200, "msg": "success", "data": {"name": "foo", "age": 16}})'
```

### end([data])

* data `<String>` | `<Buffer>` optional

> 向客户端输出内容。


### cookie(key, value, options)

* key `<String>`
* value `<String>` 
* options `<Object>` 额外配置[可选]

> 向客户端写入cookies。