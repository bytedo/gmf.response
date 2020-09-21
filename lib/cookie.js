/**
 * @author yutent<yutent.io@gmail.com>
 * @date 2020/09/20 15:08:50
 */

var KEY_REGEXP = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/
// var SPLIT_REGEXP = /; */
var encode = encodeURIComponent
// var decode = decodeURIComponent

/**
 * [serialize 序列化对象]
 */
export function serialize(key, val, opts) {
  var pairs = []
  if (!KEY_REGEXP.test(key)) {
    return ''
  }

  val = encode(val)
  opts = opts || {}

  if (val && !KEY_REGEXP.test(val)) {
    return ''
  }

  pairs.push(key + '=' + val)

  if (opts.hasOwnProperty('expires') && opts.expires) {
    // pairs.push('Expires=' + opts.expires.toUTCString())
    // 有效期, 已不建议使用,改用 max-age
    if (Date.isDate(opts.expires)) {
      opts.maxAge = ~~(opts.expires.getTime() / 1000)
    } else {
      opts.maxAge = +opts.expires
    }
    delete opts.expires
  }

  if (opts.hasOwnProperty('maxAge') && opts.maxAge) {
    //有效期
    opts.maxAge = opts.maxAge
    pairs.push('Max-Age=' + opts.maxAge)
  }

  if (opts.hasOwnProperty('domain')) {
    //域
    if (!KEY_REGEXP.test(opts.domain)) {
      return ''
    }
    pairs.push('Domain=' + opts.domain)
  }

  if (opts.hasOwnProperty('path')) {
    //目录
    if (!KEY_REGEXP.test(opts.path)) {
      return ''
    }

    pairs.push('Path=' + opts.path)
  } else {
    pairs.push('Path=/')
  }

  if (opts.httpOnly) {
    pairs.push('HttpOnly')
  }

  if (opts.secure) {
    pairs.push('Secure')
  }

  if (opts.firstPartyOnly) {
    pairs.push('First-Party-Only')
  }

  return pairs.join('; ')
}
