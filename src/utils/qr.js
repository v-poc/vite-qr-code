import gifImage from './img'
import {
  G15,
  G18,
  G15_MASK,
  MODE_LIST,
  ERROR_CORRECTION_LEVEL,
  MASK_PATTERN,  
  PATTERN_POSITION_TABLE,
  RS_BLOCK_TABLE
} from '../constants/index'
import {
  byteArrayOutputStream,
  base64EncodeOutputStream
} from './io'

/**
 * QRMode
 */
const QRMode = MODE_LIST

/**
 * QRErrorCorrectionLevel
 */
const QRErrorCorrectionLevel = ERROR_CORRECTION_LEVEL

/**
 * QRMaskPattern
 */
const QRMaskPattern = MASK_PATTERN

/**
 * QRUtil
 */
const getBCHDigit = function (data) {
  let digit = 0
  while (data != 0) {
    digit += 1
    data >>>= 1
  }
  return digit
}

export const QRUtil = {
  // get BCH TypeInfo
  getBCHTypeInfo: function (data) {
    let d = data << 10
    while (getBCHDigit(d) - getBCHDigit(G15) >= 0) {
      d ^= (G15 << (getBCHDigit(d) - getBCHDigit(G15)))
    }
    return ((data << 10) | d) ^ G15_MASK
  },
  // get BCH TypeNumber
  getBCHTypeNumber: function (data) {
    let d = data << 12
    while (getBCHDigit(d) - getBCHDigit(G18) >= 0) {
      d ^= (G18 << (getBCHDigit(d) - getBCHDigit(G18)))
    }
    return (data << 12) | d
  },
  // get Pattern Position
  getPatternPosition: function (typeNumber) {
    return PATTERN_POSITION_TABLE[typeNumber - 1]
  },
  // get Mask Function
  getMaskFunction: function (maskPattern) {
    switch (maskPattern) {
      case QRMaskPattern.PATTERN000:
        return function (i, j) { return (i + j) % 2 == 0 }
      case QRMaskPattern.PATTERN001:
        return function (i, j) { return i % 2 == 0 }
      case QRMaskPattern.PATTERN010:
        return function (i, j) { return j % 3 == 0 }
      case QRMaskPattern.PATTERN011:
        return function (i, j) { return (i + j) % 3 == 0 }
      case QRMaskPattern.PATTERN100:
        return function (i, j) { return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 == 0 }
      case QRMaskPattern.PATTERN101:
        return function (i, j) { return (i * j) % 2 + (i * j) % 3 == 0 }
      case QRMaskPattern.PATTERN110:
        return function (i, j) { return ((i * j) % 2 + (i * j) % 3) % 2 == 0 }
      case QRMaskPattern.PATTERN111:
        return function (i, j) { return ((i * j) % 3 + (i + j) % 2) % 2 == 0 }
      default:
        throw `bad maskPattern: ${maskPattern}`
    }
  },
  // get Error Correct Polynomial
  getErrorCorrectPolynomial: function (errorCorrectLength) {
    let a = qrPolynomial([1], 0)
    for (let i = 0; i < errorCorrectLength; i += 1) {
      a = a.multiply(qrPolynomial([1, QRMath.gexp(i)], 0))
    }
    return a
  },
  // get Length In Bits
  getLengthInBits: function (mode, type) {
    if (1 <= type && type < 10) {
      // 1 - 9
      switch (mode) {
        case QRMode.MODE_NUMBER: return 10
        case QRMode.MODE_ALPHA_NUM: return 9
        case QRMode.MODE_8BIT_BYTE: return 8
        case QRMode.MODE_KANJI: return 8
        default:
          throw `mode: ${mode}`
      }
    } else if (type < 27) {
      // 10 - 26
      switch (mode) {
        case QRMode.MODE_NUMBER: return 12
        case QRMode.MODE_ALPHA_NUM: return 11
        case QRMode.MODE_8BIT_BYTE: return 16
        case QRMode.MODE_KANJI: return 10
        default:
          throw `mode: ${mode}`
      }
    } else if (type < 41) {
      // 27 - 40
      switch (mode) {
        case QRMode.MODE_NUMBER: return 14
        case QRMode.MODE_ALPHA_NUM: return 13
        case QRMode.MODE_8BIT_BYTE: return 16
        case QRMode.MODE_KANJI: return 12
        default:
          throw `mode: ${mode}`
      }
    } else {
      throw `type: ${type}`
    }
  },
  // get Lost Point
  getLostPoint: function (qrcode) {
    const moduleCount = qrcode.getModuleCount()
    let lostPoint = 0
    // LEVEL1
    for (let row = 0; row < moduleCount; row += 1) {
      for (let col = 0; col < moduleCount; col += 1) {
        let sameCount = 0
        const dark = qrcode.isDark(row, col)

        for (let r = -1; r <= 1; r += 1) {
          if (row + r < 0 || moduleCount <= row + r) {
            continue
          }
          for (let c = -1; c <= 1; c += 1) {
            if (col + c < 0 || moduleCount <= col + c) {
              continue
            }
            if (r == 0 && c == 0) {
              continue
            }
            if (dark == qrcode.isDark(row + r, col + c)) {
              sameCount += 1
            }
          }
        }

        if (sameCount > 5) {
          lostPoint += (3 + sameCount - 5)
        }
      }
    }

    // LEVEL2
    for (let row = 0; row < moduleCount - 1; row += 1) {
      for (let col = 0; col < moduleCount - 1; col += 1) {
        let count = 0
        if (qrcode.isDark(row, col)) count += 1
        if (qrcode.isDark(row + 1, col)) count += 1
        if (qrcode.isDark(row, col + 1)) count += 1
        if (qrcode.isDark(row + 1, col + 1)) count += 1
        if (count == 0 || count == 4) {
          lostPoint += 3
        }
      }
    }

    // LEVEL3
    for (let row = 0; row < moduleCount; row += 1) {
      for (let col = 0; col < moduleCount - 6; col += 1) {
        if (qrcode.isDark(row, col)
          && !qrcode.isDark(row, col + 1)
          && qrcode.isDark(row, col + 2)
          && qrcode.isDark(row, col + 3)
          && qrcode.isDark(row, col + 4)
          && !qrcode.isDark(row, col + 5)
          && qrcode.isDark(row, col + 6)) {
          lostPoint += 40
        }
      }
    }

    for (let col = 0; col < moduleCount; col += 1) {
      for (let row = 0; row < moduleCount - 6; row += 1) {
        if (qrcode.isDark(row, col)
          && !qrcode.isDark(row + 1, col)
          && qrcode.isDark(row + 2, col)
          && qrcode.isDark(row + 3, col)
          && qrcode.isDark(row + 4, col)
          && !qrcode.isDark(row + 5, col)
          && qrcode.isDark(row + 6, col)) {
          lostPoint += 40
        }
      }
    }

    // LEVEL4
    let darkCount = 0
    for (let col = 0; col < moduleCount; col += 1) {
      for (let row = 0; row < moduleCount; row += 1) {
        if (qrcode.isDark(row, col)) {
          darkCount += 1
        }
      }
    }

    const ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5
    lostPoint += ratio * 10
    return lostPoint
  }
}

/**
 * QRMath
 */
const EXP_TABLE = new Array(256)
const LOG_TABLE = new Array(256)

// initialize tables
for (let i = 0; i < 8; i += 1) {
   EXP_TABLE[i] = 1 << i
}
for (let i = 8; i < 256; i += 1) {
   EXP_TABLE[i] = EXP_TABLE[i - 4]
     ^ EXP_TABLE[i - 5]
     ^ EXP_TABLE[i - 6]
     ^ EXP_TABLE[i - 8]
}
for (let i = 0; i < 255; i += 1) {
   LOG_TABLE[EXP_TABLE[i]] = i
}

export const QRMath = {
  glog: function (n) {
    if (n < 1) {
      throw `glog(${n})`
    }
    return LOG_TABLE[n]
  },
  gexp: function (n) {
    while (n < 0) {
      n += 255
    }
    while (n >= 256) {
      n -= 255
    }
    return EXP_TABLE[n]
  }
}

/**
 * QRRSBlock
 */
const qrRSBlockItem = function (totalCount, dataCount) {
  const res = {}
  res.totalCount = totalCount
  res.dataCount = dataCount
  return res
}

const getRsBlockTable = function (typeNumber, errorCorrectionLevel) {
  switch (errorCorrectionLevel) {
    case QRErrorCorrectionLevel.L:
      return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0]
    case QRErrorCorrectionLevel.M:
      return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1]
    case QRErrorCorrectionLevel.Q:
      return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2]
    case QRErrorCorrectionLevel.H:
      return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3]
    default:
      return undefined
  }
}

export const QRRSBlock = {
  getRSBlocks: function (typeNumber, errorCorrectionLevel) {
    const rsBlock = getRsBlockTable(typeNumber, errorCorrectionLevel)

    if (typeof rsBlock == 'undefined') {
      throw `bad rs block @ typeNumber: ${typeNumber} / errorCorrectionLevel: ${errorCorrectionLevel}`
    }

    const length = rsBlock.length / 3
    const list = []

    for (let i = 0; i < length; i += 1) {
      const count = rsBlock[i * 3 + 0]
      const totalCount = rsBlock[i * 3 + 1]
      const dataCount = rsBlock[i * 3 + 2]
      for (let j = 0; j < count; j += 1) {
        list.push(qrRSBlockItem(totalCount, dataCount))
      }
    }

    return list
  }
}

/**
 * qrPolynomial
 */
export const qrPolynomial = function (num, shift) {
  if (typeof num.length == 'undefined') {
    throw `${num.length} / ${shift}`
  }

  const _num = function () {
    let offset = 0
    while (offset < num.length && num[offset] == 0) {
      offset += 1
    }
    const _num = new Array(num.length - offset + shift)
    for (let i = 0; i < num.length - offset; i += 1) {
      _num[i] = num[i + offset]
    }
    return _num
  }()

  const res = {}

  res.getAt = function (index) {
    return _num[index]
  }

  res.getLength = function () {
    return _num.length
  }

  res.multiply = function (e) {
    const num = new Array(res.getLength() + e.getLength() - 1)

    for (let i = 0; i < res.getLength(); i += 1) {
      for (let j = 0; j < e.getLength(); j += 1) {
        num[i + j] ^= QRMath.gexp(QRMath.glog(res.getAt(i)) + QRMath.glog(e.getAt(j)))
      }
    }

    return qrPolynomial(num, 0)
  }

  res.mod = function (e) {
    if (res.getLength() - e.getLength() < 0) {
      return res
    }

    const ratio = QRMath.glog(res.getAt(0)) - QRMath.glog(e.getAt(0))
    const num = new Array(res.getLength())
    for (let i = 0; i < res.getLength(); i += 1) {
      num[i] = res.getAt(i)
    }

    for (let i = 0; i < e.getLength(); i += 1) {
      num[i] ^= QRMath.gexp(QRMath.glog(e.getAt(i)) + ratio)
    }

    // recursive call
    return qrPolynomial(num, 0).mod(e)
  }

  return res
}

/**
 * qrBitBuffer
 */
export const qrBitBuffer = function () {
  const _buffer = []
  let _length = 0

  const res = {}

  res.getBuffer = function () {
    return _buffer
  }

  res.getAt = function (index) {
    const bufIndex = Math.floor(index / 8)
    return ((_buffer[bufIndex] >>> (7 - index % 8)) & 1) == 1
  }

  res.put = function (num, length) {
    for (let i = 0; i < length; i += 1) {
      res.putBit(((num >>> (length - i - 1)) & 1) == 1)
    }
  }

  res.getLengthInBits = function () {
    return _length
  }

  res.putBit = function (bit) {
    const bufIndex = Math.floor(_length / 8)
    if (_buffer.length <= bufIndex) {
      _buffer.push(0)
    }
    if (bit) {
      _buffer[bufIndex] |= (0x80 >>> (_length % 8))
    }
    _length += 1
  }

  return res
}

/**
 * qrNumber
 */
export const qrNumber = function (data) {
  const _mode = QRMode.MODE_NUMBER
  const _data = data
  const res = {}

  res.getMode = function () {
    return _mode
  }

  res.getLength = function (buffer) {
    return _data.length
  }

  res.write = function (buffer) {
    const data = _data
    let i = 0

    while (i + 2 < data.length) {
      buffer.put(strToNum(data.substring(i, i + 3)), 10)
      i += 3
    }

    if (i < data.length) {
      if (data.length - i == 1) {
        buffer.put(strToNum(data.substring(i, i + 1)), 4)
      } else if (data.length - i == 2) {
        buffer.put(strToNum(data.substring(i, i + 2)), 7)
      }
    }
  }

  const strToNum = function (s) {
    let num = 0
    for (let i = 0; i < s.length; i += 1) {
      num = num * 10 + chatToNum(s.charAt(i))
    }
    return num
  }

  const chatToNum = function (c) {
    if ('0' <= c && c <= '9') {
      return c.charCodeAt(0) - '0'.charCodeAt(0)
    }
    throw `illegal char: ${c}`
  }

  return res
}

/**
 * qrAlphaNum
 */
export const qrAlphaNum = function (data) {
  const _mode = QRMode.MODE_ALPHA_NUM
  const _data = data
  const res = {}

  res.getMode = function () {
    return _mode
  }

  res.getLength = function (buffer) {
    return _data.length
  }

  res.write = function (buffer) {
    const s = _data
    let i = 0
    while (i + 1 < s.length) {
      buffer.put(
        getCode(s.charAt(i)) * 45 +
        getCode(s.charAt(i + 1)), 11)
      i += 2
    }

    if (i < s.length) {
      buffer.put(getCode(s.charAt(i)), 6)
    }
  }

  const getCode = function (c) {
    if ('0' <= c && c <= '9') {
      return c.charCodeAt(0) - '0'.charCodeAt(0)
    } else if ('A' <= c && c <= 'Z') {
      return c.charCodeAt(0) - 'A'.charCodeAt(0) + 10
    } else {
      switch (c) {
        case ' ': return 36
        case '$': return 37
        case '%': return 38
        case '*': return 39
        case '+': return 40
        case '-': return 41
        case '.': return 42
        case '/': return 43
        case ':': return 44
        default:
          throw `illegal char: ${c}`
      }
    }
  }

  return res
}

/**
 * qr8BitByte
 */
export const qr8BitByte = function (data, qrcode = window.qrcodeModule) {
  const _mode = QRMode.MODE_8BIT_BYTE
  const _bytes = qrcode.stringToBytes(data)

  const res = {}

  res.getMode = function () {
    return _mode
  }

  res.getLength = function (buffer) {
    return _bytes.length
  }

  res.write = function (buffer) {
    for (let i = 0; i < _bytes.length; i += 1) {
      buffer.put(_bytes[i], 8)
    }
  }

  return res
}

/**
 * qrKanji
 */
export const qrKanji = function (data, qrcode = window.qrcodeModule) {
  const _mode = QRMode.MODE_KANJI
  const stringToBytes = qrcode.stringToBytesFuncs['SJIS']
  if (!stringToBytes) {
    throw 'sjis not supported.'
  }
  !function (c, code) {    
    const test = stringToBytes(c) // self test for sjis support
    if (test.length != 2 || ((test[0] << 8) | test[1]) != code) {
      throw 'sjis not supported.'
    }
  }('\u53cb', 0x9746)

  const _bytes = stringToBytes(data)
  const res = {}

  res.getMode = function () {
    return _mode
  }

  res.getLength = function (buffer) {
    return ~~(_bytes.length / 2) // ~~ usage
  }

  res.write = function (buffer) {
    const data = _bytes
    let i = 0
    while (i + 1 < data.length) {
      let c = ((0xff & data[i]) << 8) | (0xff & data[i + 1])

      if (0x8140 <= c && c <= 0x9FFC) {
        c -= 0x8140
      } else if (0xE040 <= c && c <= 0xEBBF) {
        c -= 0xC140
      } else {
        throw `illegal char at ${(i + 1)} / ${c}`
      }

      c = ((c >>> 8) & 0xff) * 0xC0 + (c & 0xff)
      buffer.put(c, 13)
      i += 2
    }

    if (i < data.length) {
      throw `illegal char at ${(i + 1)}`
    }
  }

  return res
}

/**
 * createDataURL
 */
export const createDataURL = function (width, height, getPixel) {
  const gif = gifImage(width, height)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      gif.setPixel(x, y, getPixel(x, y))
    }
  }

  const b = byteArrayOutputStream()
  gif.write(b)

  const base64 = base64EncodeOutputStream()
  const bytes = b.toByteArray()
  for (let i = 0; i < bytes.length; i += 1) {
    base64.writeByte(bytes[i])
  }
  base64.flush()

  return 'data:image/gif;base64,' + base64
}
