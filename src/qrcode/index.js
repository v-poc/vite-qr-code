/*
 * Inspired by QRCodeGenerator | MIT License (https://github.com/kazuhikoarase/qrcode-generator)
 */
import {
  PAD0,
  PAD1,
  ERROR_CORRECTION_LEVEL
} from '../constants/index'
import {
  QRUtil,
  QRRSBlock,
  qrPolynomial,
  qrBitBuffer,
  qrNumber,
  qrAlphaNum,
  qr8BitByte,
  qrKanji,
  createDataURL
} from '../utils/qr'
import { base64DecodeInputStream } from '../utils/io'

/**
 * QRErrorCorrectionLevel
 */
const QRErrorCorrectionLevel = ERROR_CORRECTION_LEVEL

/**
 * The qrcode module
 * @param typeNumber The TypeNumber value (from 1 to 40)
 * @param errorCorrectionLevel The Error Correction Level ('L','M','Q','H')
 */
const qrcodeModule = function (typeNumber, errorCorrectionLevel) {
  let _typeNumber = typeNumber
  const _errorCorrectionLevel = QRErrorCorrectionLevel[errorCorrectionLevel]
  const _dataList = [], res = {}
  let _modules = null, _moduleCount = 0, _dataCache = null  

  const makeImpl = function (test, maskPattern) {
    _moduleCount = _typeNumber * 4 + 17
    _modules = function (moduleCount) {
      const modules = new Array(moduleCount)
      for (let row = 0; row < moduleCount; row += 1) {
        modules[row] = new Array(moduleCount)
        for (let col = 0; col < moduleCount; col += 1) {
          modules[row][col] = null
        }
      }
      return modules
    }(_moduleCount)

    setupPositionProbePattern(0, 0)
    setupPositionProbePattern(_moduleCount - 7, 0)
    setupPositionProbePattern(0, _moduleCount - 7)
    setupPositionAdjustPattern()
    setupTimingPattern()
    setupTypeInfo(test, maskPattern)

    if (_typeNumber >= 7) {
      setupTypeNumber(test)
    }

    if (_dataCache == null) {
      _dataCache = createData(_typeNumber, _errorCorrectionLevel, _dataList)
    }

    mapData(_dataCache, maskPattern)
  }

  const setupPositionProbePattern = function (row, col) {
    for (let r = -1; r <= 7; r += 1) {
      if (row + r <= -1 || _moduleCount <= row + r) {
        continue
      }

      for (let c = -1; c <= 7; c += 1) {
        if (col + c <= -1 || _moduleCount <= col + c) {
          continue
        }

        if ((0 <= r && r <= 6 && (c == 0 || c == 6))
          || (0 <= c && c <= 6 && (r == 0 || r == 6))
          || (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
          _modules[row + r][col + c] = true
        } else {
          _modules[row + r][col + c] = false
        }
      }
    }
  }

  const getBestMaskPattern = function () {
    let minLostPoint = 0
    let pattern = 0

    for (let i = 0; i < 8; i += 1) {
      makeImpl(true, i)
      const lostPoint = QRUtil.getLostPoint(res)

      if (i == 0 || minLostPoint > lostPoint) {
        minLostPoint = lostPoint
        pattern = i
      }
    }

    return pattern
  }

  const setupTimingPattern = function () {
    for (let r = 8; r < _moduleCount - 8; r += 1) {
      if (_modules[r][6] != null) {
        continue
      }
      _modules[r][6] = (r % 2 == 0)
    }

    for (let c = 8; c < _moduleCount - 8; c += 1) {
      if (_modules[6][c] != null) {
        continue
      }
      _modules[6][c] = (c % 2 == 0)
    }
  }

  const setupPositionAdjustPattern = function () {
    const pos = QRUtil.getPatternPosition(_typeNumber)
    for (let i = 0; i < pos.length; i += 1) {
      for (let j = 0; j < pos.length; j += 1) {
        const row = pos[i]
        const col = pos[j]

        if (_modules[row][col] != null) {
          continue
        }

        for (let r = -2; r <= 2; r += 1) {
          for (let c = -2; c <= 2; c += 1) {
            if (r == -2 || r == 2 || c == -2 || c == 2
              || (r == 0 && c == 0)) {
              _modules[row + r][col + c] = true
            } else {
              _modules[row + r][col + c] = false
            }
          }
        }
      }
    }
  }

  const setupTypeNumber = function (test) {
    const bits = QRUtil.getBCHTypeNumber(_typeNumber)

    for (let i = 0; i < 18; i += 1) {
      const mod = (!test && ((bits >> i) & 1) == 1)
      _modules[Math.floor(i / 3)][i % 3 + _moduleCount - 8 - 3] = mod
    }
    for (let i = 0; i < 18; i += 1) {
      const mod = (!test && ((bits >> i) & 1) == 1)
      _modules[i % 3 + _moduleCount - 8 - 3][Math.floor(i / 3)] = mod
    }
  }

  const setupTypeInfo = function (test, maskPattern) {
    const data = (_errorCorrectionLevel << 3) | maskPattern
    const bits = QRUtil.getBCHTypeInfo(data)

    // vertical
    for (let i = 0; i < 15; i += 1) {
      const mod = (!test && ((bits >> i) & 1) == 1)
      if (i < 6) {
        _modules[i][8] = mod
      } else if (i < 8) {
        _modules[i + 1][8] = mod
      } else {
        _modules[_moduleCount - 15 + i][8] = mod
      }
    }

    // horizontal
    for (let i = 0; i < 15; i += 1) {
      const mod = (!test && ((bits >> i) & 1) == 1)
      if (i < 8) {
        _modules[8][_moduleCount - i - 1] = mod
      } else if (i < 9) {
        _modules[8][15 - i - 1 + 1] = mod
      } else {
        _modules[8][15 - i - 1] = mod
      }
    }

    // fixed module
    _modules[_moduleCount - 8][8] = (!test)
  }

  const mapData = function (data, maskPattern) {
    let inc = -1
    let row = _moduleCount - 1
    let bitIndex = 7
    let byteIndex = 0
    const maskFunc = QRUtil.getMaskFunction(maskPattern)

    for (let col = _moduleCount - 1; col > 0; col -= 2) {
      if (col == 6) col -= 1
      while (true) {

        for (let c = 0; c < 2; c += 1) {
          if (_modules[row][col - c] == null) {
            let dark = false
            if (byteIndex < data.length) {
              dark = (((data[byteIndex] >>> bitIndex) & 1) == 1)
            }

            const mask = maskFunc(row, col - c)
            if (mask) {
              dark = !dark
            }

            _modules[row][col - c] = dark
            bitIndex -= 1

            if (bitIndex == -1) {
              byteIndex += 1
              bitIndex = 7
            }
          }
        }

        row += inc

        if (row < 0 || _moduleCount <= row) {
          row -= inc
          inc = -inc
          break
        }
      }
    }
  }

  const createBytes = function (buffer, rsBlocks) {
    let offset = 0
    let maxDcCount = 0
    let maxEcCount = 0
    const dcdata = new Array(rsBlocks.length)
    const ecdata = new Array(rsBlocks.length)

    for (let r = 0; r < rsBlocks.length; r += 1) {
      const dcCount = rsBlocks[r].dataCount
      const ecCount = rsBlocks[r].totalCount - dcCount

      maxDcCount = Math.max(maxDcCount, dcCount)
      maxEcCount = Math.max(maxEcCount, ecCount)

      dcdata[r] = new Array(dcCount)

      for (let i = 0; i < dcdata[r].length; i += 1) {
        dcdata[r][i] = 0xff & buffer.getBuffer()[i + offset]
      }
      offset += dcCount

      const rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount)
      const rawPoly = qrPolynomial(dcdata[r], rsPoly.getLength() - 1)

      const modPoly = rawPoly.mod(rsPoly)
      ecdata[r] = new Array(rsPoly.getLength() - 1)
      for (let i = 0; i < ecdata[r].length; i += 1) {
        const modIndex = i + modPoly.getLength() - ecdata[r].length
        ecdata[r][i] = (modIndex >= 0) ? modPoly.getAt(modIndex) : 0
      }
    }

    let totalCodeCount = 0
    for (let i = 0; i < rsBlocks.length; i += 1) {
      totalCodeCount += rsBlocks[i].totalCount
    }

    const data = new Array(totalCodeCount)
    let index = 0

    for (let i = 0; i < maxDcCount; i += 1) {
      for (let r = 0; r < rsBlocks.length; r += 1) {
        if (i < dcdata[r].length) {
          data[index] = dcdata[r][i]
          index += 1
        }
      }
    }

    for (let i = 0; i < maxEcCount; i += 1) {
      for (let r = 0; r < rsBlocks.length; r += 1) {
        if (i < ecdata[r].length) {
          data[index] = ecdata[r][i]
          index += 1
        }
      }
    }

    return data
  }

  const createData = function (typeNumber, errorCorrectionLevel, dataList) {
    const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectionLevel)
    const buffer = qrBitBuffer()

    for (let i = 0; i < dataList.length; i += 1) {
      const data = dataList[i]
      buffer.put(data.getMode(), 4)
      buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber))
      data.write(buffer)
    }

    // calc num max data
    let totalDataCount = 0
    for (let i = 0; i < rsBlocks.length; i += 1) {
      totalDataCount += rsBlocks[i].dataCount
    }

    if (buffer.getLengthInBits() > totalDataCount * 8) {
      throw `code length overflow. (${buffer.getLengthInBits()} > ${totalDataCount * 8})`
    }

    // end code
    if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
      buffer.put(0, 4)
    }

    // padding
    while (buffer.getLengthInBits() % 8 != 0) {
      buffer.putBit(false)
    }

    // padding
    while (true) {
      if (buffer.getLengthInBits() >= totalDataCount * 8) {
        break
      }
      buffer.put(PAD0, 8)

      if (buffer.getLengthInBits() >= totalDataCount * 8) {
        break
      }
      buffer.put(PAD1, 8)
    }

    return createBytes(buffer, rsBlocks)
  }

  res.addData = function (data, mode) {
    mode = mode || 'Byte'
    let newData = null

    switch (mode) {
      case 'Numeric':
        newData = qrNumber(data)
        break
      case 'Alphanumeric':
        newData = qrAlphaNum(data)
        break
      case 'Byte':
        newData = qr8BitByte(data, qrcodeModule) // 2nd param should be `qrcodeModule` rather than `res`
        break
      case 'Kanji':
        newData = qrKanji(data, qrcodeModule) // 2nd param should be `qrcodeModule` rather than `res`
        break
      default:
        throw `mode: ${mode}`
    }

    _dataList.push(newData)
    _dataCache = null

    return res // for chaining
  }

  res.isDark = function (row, col) {
    if (row < 0 || _moduleCount <= row || col < 0 || _moduleCount <= col) {
      throw `${row}, ${col}`
    }
    return _modules[row][col]
  }

  res.getModuleCount = function () {
    return _moduleCount
  }

  res.make = function () {
    if (_typeNumber < 1) {
      let typeNumber = 1

      for (; typeNumber < 40; typeNumber++) {
        const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, _errorCorrectionLevel)
        const buffer = qrBitBuffer()

        for (let i = 0; i < _dataList.length; i++) {
          const data = _dataList[i]
          buffer.put(data.getMode(), 4)
          buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber))
          data.write(buffer)
        }

        let totalDataCount = 0
        for (let i = 0; i < rsBlocks.length; i++) {
          totalDataCount += rsBlocks[i].dataCount
        }

        if (buffer.getLengthInBits() <= totalDataCount * 8) {
          break
        }
      }

      _typeNumber = typeNumber      
    }

    makeImpl(false, getBestMaskPattern())
  }

  res.createTableTag = function (cellSize, margin, color) {
    cellSize = cellSize || 2
    margin = (typeof margin == 'undefined') ? cellSize * 4 : margin

    let qrHtml = ''

    qrHtml += '<table style="'
    qrHtml += ' border-width: 0px; border-style: none;'
    qrHtml += ' border-collapse: collapse;'
    qrHtml += ' padding: 0px; margin: ' + margin + 'px;'
    qrHtml += '">'
    qrHtml += '<tbody>'

    for (let r = 0; r < res.getModuleCount(); r += 1) {

      qrHtml += '<tr>'

      for (let c = 0; c < res.getModuleCount(); c += 1) {
        qrHtml += '<td style="'
        qrHtml += ' border-width: 0px; border-style: none;'
        qrHtml += ' border-collapse: collapse;'
        qrHtml += ' padding: 0px; margin: 0px;'
        qrHtml += ' width: ' + cellSize + 'px;'
        qrHtml += ' height: ' + cellSize + 'px;'
        qrHtml += ' background-color: '
        qrHtml += res.isDark(r, c) ? (color || '#000000') : '#ffffff'
        qrHtml += ';'
        qrHtml += '"/>'
      }

      qrHtml += '</tr>'
    }

    qrHtml += '</tbody>'
    qrHtml += '</table>'

    return qrHtml
  }

  res.createSvgTag = function (cellSize, margin, alt, title, color) {
    let opts = {}
    if (typeof arguments[0] == 'object') {
      // Called by options
      opts = arguments[0]
      // overwrite cellSize and margin
      cellSize = opts.cellSize
      margin = opts.margin
      alt = opts.alt
      title = opts.title
    }

    cellSize = cellSize || 2
    margin = (typeof margin == 'undefined') ? cellSize * 4 : margin

    // Compose alt property surrogate
    alt = (typeof alt === 'string') ? { text: alt } : alt || {}
    alt.text = alt.text || null
    alt.id = (alt.text) ? alt.id || 'qrcode-description' : null

    // Compose title property surrogate
    title = (typeof title === 'string') ? { text: title } : title || {}
    title.text = title.text || null
    title.id = (title.text) ? title.id || 'qrcode-title' : null

    const size = res.getModuleCount() * cellSize + margin * 2
    let c, mc, r, mr, qrSvg = '', rect

    rect = 'l' + cellSize + ',0 0,' + cellSize +
      ' -' + cellSize + ',0 0,-' + cellSize + 'z '

    qrSvg += '<svg version="1.1" xmlns="http://www.w3.org/2000/svg"'
    qrSvg += !opts.scalable ? ' width="' + size + 'px" height="' + size + 'px"' : ''
    qrSvg += ' viewBox="0 0 ' + size + ' ' + size + '" '
    qrSvg += ' preserveAspectRatio="xMinYMin meet"'
    qrSvg += (title.text || alt.text) ? ' role="img" aria-labelledby="' +
      escapeXml([title.id, alt.id].join(' ').trim()) + '"' : ''
    qrSvg += '>'
    qrSvg += (title.text) ? '<title id="' + escapeXml(title.id) + '">' +
      escapeXml(title.text) + '</title>' : ''
    qrSvg += (alt.text) ? '<description id="' + escapeXml(alt.id) + '">' +
      escapeXml(alt.text) + '</description>' : ''
    qrSvg += '<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>'
    qrSvg += '<path d="'

    for (r = 0; r < res.getModuleCount(); r += 1) {
      mr = r * cellSize + margin
      for (c = 0; c < res.getModuleCount(); c += 1) {
        if (res.isDark(r, c)) {
          mc = c * cellSize + margin
          qrSvg += 'M' + mc + ',' + mr + rect
        }
      }
    }

    qrSvg += `" stroke="transparent" fill="${color || 'black'}"/>`
    qrSvg += '</svg>'

    return qrSvg
  }

  res.createDataURL = function (cellSize, margin) {
    cellSize = cellSize || 2
    margin = (typeof margin == 'undefined') ? cellSize * 4 : margin

    const size = res.getModuleCount() * cellSize + margin * 2
    const min = margin
    const max = size - margin

    return createDataURL(size, size, function (x, y) {
      if (min <= x && x < max && min <= y && y < max) {
        const c = Math.floor((x - min) / cellSize)
        const r = Math.floor((y - min) / cellSize)
        return res.isDark(r, c) ? 0 : 1
      } else {
        return 1
      }
    })
  }

  res.createImgTag = function (cellSize, margin, alt) {
    cellSize = cellSize || 2
    margin = (typeof margin == 'undefined') ? cellSize * 4 : margin
    const size = res.getModuleCount() * cellSize + margin * 2

    let img = ''
    img += '<img'
    img += '\u0020src="'
    img += res.createDataURL(cellSize, margin)
    img += '"'
    img += '\u0020width="'
    img += size
    img += '"'
    img += '\u0020height="'
    img += size
    img += '"'
    if (alt) {
      img += '\u0020alt="'
      img += escapeXml(alt)
      img += '"'
    }
    img += '/>'

    return img
  }

  const escapeXml = function (s) {
    let escaped = ''
    for (let i = 0; i < s.length; i += 1) {
      const c = s.charAt(i)
      switch (c) {
        case '<':
          escaped += '&lt;'
          break
        case '>':
          escaped += '&gt;'
          break
        case '&':
          escaped += '&amp;'
          break
        case '"':
          escaped += '&quot;'
          break
        default:
          escaped += c
          break
      }
    }
    return escaped
  }

  const _createHalfASCII = function (margin) {
    const cellSize = 1
    margin = (typeof margin == 'undefined') ? cellSize * 2 : margin

    const size = res.getModuleCount() * cellSize + margin * 2
    const min = margin
    const max = size - margin

    let y, x, r1, r2, p

    const blocks = {
      '██': '█',
      '█ ': '▀',
      ' █': '▄',
      '  ': ' '
    }

    const blocksLastLineNoMargin = {
      '██': '▀',
      '█ ': '▀',
      ' █': ' ',
      '  ': ' '
    }

    let ascii = ''
    for (y = 0; y < size; y += 2) {
      r1 = Math.floor((y - min) / cellSize)
      r2 = Math.floor((y + 1 - min) / cellSize)
      for (x = 0; x < size; x += 1) {
        p = '█'

        if (min <= x && x < max && min <= y && y < max && res.isDark(r1, Math.floor((x - min) / cellSize))) {
          p = ' '
        }

        if (min <= x && x < max && min <= y + 1 && y + 1 < max && res.isDark(r2, Math.floor((x - min) / cellSize))) {
          p += ' '
        }
        else {
          p += '█'
        }

        // Output 2 characters per pixel, to create full square.
        // 1 character per pixels gives only half width of square.
        ascii += (margin < 1 && y + 1 >= max) ? blocksLastLineNoMargin[p] : blocks[p]
      }

      ascii += '\n'
    }

    if (size % 2 && margin > 0) {
      return ascii.substring(0, ascii.length - size - 1) + Array(size + 1).join('▀')
    }

    return ascii.substring(0, ascii.length - 1)
  }

  res.createASCII = function (cellSize, margin) {
    cellSize = cellSize || 1

    if (cellSize < 2) {
      return _createHalfASCII(margin)
    }

    cellSize -= 1
    margin = (typeof margin == 'undefined') ? cellSize * 2 : margin

    const size = res.getModuleCount() * cellSize + margin * 2
    const min = margin
    const max = size - margin

    let y, x, r, p
    const white = Array(cellSize + 1).join('██')
    const black = Array(cellSize + 1).join('  ')

    let ascii = '', line = ''
    for (y = 0; y < size; y += 1) {
      r = Math.floor((y - min) / cellSize)
      line = ''
      for (x = 0; x < size; x += 1) {
        p = 1
        if (min <= x && x < max && min <= y && y < max && res.isDark(r, Math.floor((x - min) / cellSize))) {
          p = 0
        }
        // Output 2 characters per pixel, to create full square.
        // 1 character per pixels gives only half width of square.
        line += p ? white : black
      }

      for (r = 0; r < cellSize; r += 1) {
        ascii += line + '\n'
      }
    }

    return ascii.substring(0, ascii.length - 1)
  }

  res.renderTo2dContext = function (context, cellSize) {
    cellSize = cellSize || 2
    const length = res.getModuleCount()
    for (let row = 0; row < length; row++) {
      for (let col = 0; col < length; col++) {
        context.fillStyle = res.isDark(row, col) ? 'black' : 'white'
        context.fillRect(row * cellSize, col * cellSize, cellSize, cellSize)
      }
    }
  }

  return res
}

/**
 * qrcodeModule.stringToBytes
 */
 qrcodeModule.stringToBytesFuncs = {
  'default': function (s) {
    const bytes = []
    for (let i = 0; i < s.length; i += 1) {
      const c = s.charCodeAt(i)
      bytes.push(c & 0xff)
    }
    return bytes
  },
  'UTF-8': function (s) { // multibyte support
    function toUTF8Array(str) {
      const utf8 = []
      for (let i = 0; i < str.length; i++) {
        let charcode = str.charCodeAt(i)
        if (charcode < 0x80) utf8.push(charcode)
        else if (charcode < 0x800) {
          utf8.push(0xc0 | (charcode >> 6),
            0x80 | (charcode & 0x3f))
        }
        else if (charcode < 0xd800 || charcode >= 0xe000) {
          utf8.push(0xe0 | (charcode >> 12),
            0x80 | ((charcode >> 6) & 0x3f),
            0x80 | (charcode & 0x3f))
        }
        // surrogate pair
        else {
          i++
          // UTF-16 encodes 0x10000-0x10FFFF by
          // subtracting 0x10000 and splitting the
          // 20 bits of 0x0-0xFFFFF into two halves
          charcode = 0x10000 + (((charcode & 0x3ff) << 10)
            | (str.charCodeAt(i) & 0x3ff))
          utf8.push(0xf0 | (charcode >> 18),
            0x80 | ((charcode >> 12) & 0x3f),
            0x80 | ((charcode >> 6) & 0x3f),
            0x80 | (charcode & 0x3f))
        }
      }
      return utf8
    }
    return toUTF8Array(s)
  }
}

qrcodeModule.stringToBytes = qrcodeModule.stringToBytesFuncs['default']

/**
 * qrcodeModule.createStringToBytes
 */
/**
 * @param unicodeData base64 string of byte array.
 * [16bit Unicode],[16bit Bytes], ...
 * @param numChars
 */
 qrcodeModule.createStringToBytes = function (unicodeData, numChars) {
  // create conversion map
  const unicodeMap = function () {
    const bin = base64DecodeInputStream(unicodeData)
    const read = function () {
      const b = bin.read()
      if (b == -1) throw 'eof'
      return b
    }

    let count = 0
    const unicodeMap = {}
    while (true) {
      const b0 = bin.read()
      if (b0 == -1) break
      const b1 = read()
      const b2 = read()
      const b3 = read()
      const k = String.fromCharCode((b0 << 8) | b1)
      const v = (b2 << 8) | b3
      unicodeMap[k] = v
      count += 1
    }
    if (count != numChars) {
      throw `${count} != ${numChars}`
    }

    return unicodeMap
  }()

  const unknownChar = '?'.charCodeAt(0)

  return function (s) {
    const bytes = []
    for (let i = 0; i < s.length; i += 1) {
      const c = s.charCodeAt(i)
      if (c < 128) {
        bytes.push(c)
      } else {
        const b = unicodeMap[s.charAt(i)]
        if (typeof b == 'number') {
          if ((b & 0xff) == b) { // 1byte
            bytes.push(b)
          } else { // 2bytes        
            bytes.push(b >>> 8)
            bytes.push(b & 0xff)
          }
        } else {
          bytes.push(unknownChar)
        }
      }
    }
    return bytes
  }
}

export default qrcodeModule
