const encode = function (n) {
  if (n < 0) {
    // could be error
  } else if (n < 26) {
    return 0x41 + n
  } else if (n < 52) {
    return 0x61 + (n - 26)
  } else if (n < 62) {
    return 0x30 + (n - 52)
  } else if (n == 62) {
    return 0x2b
  } else if (n == 63) {
    return 0x2f
  }
  throw `n: ${n}`
}

const decode = function (c) {
  if (0x41 <= c && c <= 0x5a) {
    return c - 0x41
  } else if (0x61 <= c && c <= 0x7a) {
    return c - 0x61 + 26
  } else if (0x30 <= c && c <= 0x39) {
    return c - 0x30 + 52
  } else if (c == 0x2b) {
    return 62
  } else if (c == 0x2f) {
    return 63
  } else {
    throw `c: ${c}`
  }
}

/**
 * byteArray OutputStream
 */
export const byteArrayOutputStream = function () {
  const _bytes = [], res = {}

  res.writeByte = function (b) {
    _bytes.push(b & 0xff)
  }

  res.writeShort = function (i) {
    res.writeByte(i)
    res.writeByte(i >>> 8)
  }

  res.writeBytes = function (b, off, len) {
    off = off || 0
    len = len || b.length
    for (let i = 0; i < len; i += 1) {
      res.writeByte(b[i + off])
    }
  }

  res.writeString = function (s) {
    for (let i = 0; i < s.length; i += 1) {
      res.writeByte(s.charCodeAt(i))
    }
  }

  res.toByteArray = function () {
    return _bytes
  }

  res.toString = function () {
    let s = ''
    s += '['
    for (let i = 0; i < _bytes.length; i += 1) {
      if (i > 0) {
        s += ','
      }
      s += _bytes[i]
    }
    s += ']'
    return s
  }

  return res
}

/**
 * base64Encode OutputStream
 */
export const base64EncodeOutputStream = function () {
  let _buffer = 0, _buflen = 0, _length = 0, _base64 = ''
  const res = {}

  const writeEncoded = function (b) {
    _base64 += String.fromCharCode(encode(b & 0x3f))
  }

  res.writeByte = function (n) {
    _buffer = (_buffer << 8) | (n & 0xff)
    _buflen += 8
    _length += 1

    while (_buflen >= 6) {
      writeEncoded(_buffer >>> (_buflen - 6))
      _buflen -= 6
    }
  }

  res.flush = function () {
    if (_buflen > 0) {
      writeEncoded(_buffer << (6 - _buflen))
      _buffer = 0
      _buflen = 0
    }

    if (_length % 3 != 0) {      
      const padlen = 3 - _length % 3 // padding
      for (let i = 0; i < padlen; i += 1) {
        _base64 += '='
      }
    }
  }

  res.toString = function () {
    return _base64
  }

  return res
}

/**
 * base64Decode InputStream
 */
export const base64DecodeInputStream = function (str) {
  const _str = str, res = {}
  let _pos = 0, _buffer = 0, _buflen = 0

  res.read = function () {
    while (_buflen < 8) {

      if (_pos >= _str.length) {
        if (_buflen == 0) {
          return -1
        }
        throw `unexpected end of file./${_buflen}`
      }

      const c = _str.charAt(_pos)
      _pos += 1

      if (c == '=') {
        _buflen = 0
        return -1
      } else if (c.match(/^\s$/)) { // ignore if whitespace
        continue
      }

      _buffer = (_buffer << 6) | decode(c.charCodeAt(0))
      _buflen += 6
    }

    const n = (_buffer >>> (_buflen - 8)) & 0xff
    _buflen -= 8
    return n
  }

  return res
}
