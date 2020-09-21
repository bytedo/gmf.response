/**
 * @author yutent<yutent.io@gmail.com>
 * @date 2020/09/16 14:52:58
 */

import fs from 'iofs'
import STATUS_TEXT from './lib/http-code.js'
import { serialize } from './lib/cookie.js'

export default class Response {
  constructor(req, res) {
    this.origin = { req, res }
    this.rendered = false
  }

  /**
   * [error http 错误显示]
   * @param  {Number} code [http错误码]
   * @param  {String} msg  [错误提示信息]
   */
  error(msg, code = 500) {
    if (this.rendered) {
      return
    }
    msg = msg || STATUS_TEXT[code]

    this.status(code)
    this.set('Content-Type', 'text/html; charset=utf-8')
    this.end(
      `<fieldset><legend>Http Status: ${code}</legend><pre>${msg}</pre></fieldset>`
    )
  }

  status(code = 404) {
    this.statusCode = code
  }

  /**
   * [redirect 页面跳转]
   * @param  {String} url [要跳转的URL]
   * @param  {Boolean} f   [是否永久重定向]
   */
  redirect(url, f = false) {
    if (this.rendered) {
      return
    }
    if (!/^(http[s]?|ftp):\/\//.test(url)) {
      url = '//' + url
    }
    this.set('Location', url)
    this.status(f ? 301 : 302)
    this.end('')
  }

  /**
   * [location 页面跳转(前端的方式)]
   */
  location(url) {
    var html = `<html><head><meta http-equiv="refresh" content="0;url=${url}"></head></html>`
    if (this.rendered) {
      return
    }
    this.render(html)
  }

  // 以html格式向前端输出内容
  render(data, code) {
    if (this.rendered) {
      return
    }
    data += ''
    data = data || STATUS_TEXT[code]
    this.set('Content-Type', 'text/html')
    this.set('Content-Length', Buffer.byteLength(data))
    if (code) {
      this.status(code)
    }
    this.end(data)
  }

  // 文件下载
  sendfile(target, filename) {
    if (this.rendered) {
      return
    }
    var data

    this.set('Content-Type', 'application/force-download')
    this.set('Accept-Ranges', 'bytes')
    this.set('Content-Disposition', `attachment;filename="${filename}"`)

    if (Buffer.isBuffer(target)) {
      data = target
    } else {
      if (typeof target === 'string') {
        var stat = fs.stat(target)
        if (stat.isFile()) {
          this.set('Content-Length', stat.size)
          fs.origin.createReadStream(target).pipe(this.origin.res)
          return
        }
      }
      data = Buffer.from(target + '')
    }

    this.set('Content-Length', data.length)
    this.end(data)
  }

  /**
   * [send json格式输出]
   * @param  {Num}        code     [返回码]
   * @param  {Str}        msg      [提示信息]
   * @param  {Str/Obj}    data     [额外数据]
   * @param  {Str}        callback [回调函数名]
   */
  send(code = 200, msg = 'success', data = null, callback = null) {
    var output

    if (this.rendered) {
      return
    }
    if (typeof code !== 'number') {
      if (typeof code === 'object') {
        data = code
        code = 200
        msg = STATUS_TEXT[code]
      } else {
        msg = code + ''
        code = 400
      }
    } else if (typeof msg === 'object') {
      data = msg
      code = code || 200
      msg = STATUS_TEXT[code] || 'success'
    }

    output = { code, msg, data }
    output = JSON.stringify(output)

    if (callback) {
      callback = callback.replace(/[^\w\-\.]/g, '')
      output = callback + '(' + output + ')'
    }

    this.set('Content-Type', 'application/json')
    this.set('Content-Length', Buffer.byteLength(output))

    // 只设置200以上的值
    if (code && code > 200) {
      this.status(code)
    }

    this.end(output)
  }

  end(buf) {
    var code = 200
    if (this.rendered) {
      return this
    }
    if (this.statusCode) {
      code = this.statusCode
      delete this.statusCode
    }
    this.rendered = true
    this.origin.res.writeHead(code, STATUS_TEXT[code])
    this.origin.res.end(buf || '')
  }

  /**
   * [get 读取已写入的头信息]
   */
  get(key) {
    return this.origin.res.getHeader(key)
  }

  /**
   * [set 设置头信息]
   */
  set(key, val) {
    if (this.rendered) {
      return this
    }
    if (arguments.length === 2) {
      var value = Array.isArray(val) ? val.map(String) : String(val)

      if (
        key.toLowerCase() === 'content-type' &&
        typeof value === 'string' &&
        value.indexOf('charset') < 0
      ) {
        value += '; charset=utf-8'
      }

      this.origin.res.setHeader(key, value)
    } else {
      for (let i in key) {
        this.set(i, key[i])
      }
    }
    return this
  }

  /**
   * [append 往header插入信息]
   * @param  {String} key [description]
   * @param  {String} val [description]
   */
  append(key, val) {
    if (this.rendered) {
      return
    }
    var prev = this.get(key)
    var value

    if (Array.isArray(val)) {
      value = val
    } else {
      value = [val]
    }

    if (prev) {
      if (Array.isArray(prev)) {
        value = prev.concat(val)
      } else {
        value = [prev].concat(val)
      }
    }
    return this.set(key, value)
  }

  /**
   * [set 设置cookie]
   * @param {[string]} key
   * @param {[string/number]} val
   * @param {[object]} opts [设置cookie的额外信息,如域,有效期等]
   */
  cookie(key, val, opts = {}) {
    //读取之前已经写过的cookie缓存
    var cache = this.get('set-cookie')
    if (cache) {
      if (!Array.isArray(cache)) {
        cache = [cache]
      }
    } else {
      cache = []
    }

    if (cache.length > 0) {
      // 如果之前已经写了一个相同的cookie, 则删除之前的
      cache = cache.filter(it => {
        let _key = it.split('=')[0].trim()
        return key !== _key
      })
    }

    cache.push(serialize(key, val, opts))

    this.set('set-cookie', cache)
  }
}
