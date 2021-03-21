import { byteArrayOutputStream } from './io'

const bitOutputStream = function (out) {
  const _out = out
  let _bitLength = 0
  let _bitBuffer = 0

  const res = {}

  res.write = function (data, length) {
    if ((data >>> length) != 0) {
      throw 'length over'
    }

    while (_bitLength + length >= 8) {
      _out.writeByte(0xff & ((data << _bitLength) | _bitBuffer))
      length -= (8 - _bitLength)
      data >>>= (8 - _bitLength)
      _bitBuffer = 0
      _bitLength = 0
    }

    _bitBuffer = (data << _bitLength) | _bitBuffer
    _bitLength = _bitLength + length
  }

  res.flush = function () {
    if (_bitLength > 0) {
      _out.writeByte(_bitBuffer)
    }
  }

  return res
}

const getLZWRaster = function (lzwMinCodeSize, data) {
  const clearCode = 1 << lzwMinCodeSize
  const endCode = (1 << lzwMinCodeSize) + 1
  let bitLength = lzwMinCodeSize + 1

  const table = lzwTable() // Setup LZWTable

  for (let i = 0; i < clearCode; i += 1) {
    table.add(String.fromCharCode(i))
  }
  table.add(String.fromCharCode(clearCode))
  table.add(String.fromCharCode(endCode))

  const byteOut = byteArrayOutputStream()
  const bitOut = bitOutputStream(byteOut)

  bitOut.write(clearCode, bitLength) // clear code

  let dataIndex = 0
  const _data = data

  let s = String.fromCharCode(_data[dataIndex])
  dataIndex += 1

  while (dataIndex < _data.length) {
    const c = String.fromCharCode(_data[dataIndex])
    dataIndex += 1

    if (table.contains(s + c)) {
      s = s + c
    } else {
      bitOut.write(table.indexOf(s), bitLength)

      if (table.size() < 0xfff) {
        if (table.size() == (1 << bitLength)) {
          bitLength += 1
        }
        table.add(s + c)
      }

      s = c
    }
  }

  bitOut.write(table.indexOf(s), bitLength)
  bitOut.write(endCode, bitLength) // end code
  bitOut.flush()

  return byteOut.toByteArray()
}

const lzwTable = function () {
  const _map = {}
  let _size = 0
  const res = {}

  res.add = function (key) {
    if (res.contains(key)) {
      throw `dup key: ${key}`
    }
    _map[key] = _size
    _size += 1
  }

  res.size = function () {
    return _size
  }

  res.indexOf = function (key) {
    return _map[key]
  }

  res.contains = function (key) {
    return typeof _map[key] != 'undefined'
  }

  return res
}

const GIFImage = function (width, height) {
  const _width = width
  const _height = height
  const _data = new Array(width * height)

  const res = {}

  res.setPixel = function (x, y, pixel) {
    _data[y * _width + x] = pixel
  }

  res.write = function (out) {    
    out.writeString('GIF87a') // GIF Signature Start

    // Screen Descriptor
    out.writeShort(_width)
    out.writeShort(_height)

    out.writeByte(0x80) // 2bit
    out.writeByte(0)
    out.writeByte(0)

    // Global Color Map
    // black
    out.writeByte(0x00)
    out.writeByte(0x00)
    out.writeByte(0x00)

    // white
    out.writeByte(0xff)
    out.writeByte(0xff)
    out.writeByte(0xff)

    // Image Descriptor
    out.writeString(',')
    out.writeShort(0)
    out.writeShort(0)
    out.writeShort(_width)
    out.writeShort(_height)
    out.writeByte(0)

    // Local Color Map
    // Raster Data
    const lzwMinCodeSize = 2
    const raster = getLZWRaster(lzwMinCodeSize, _data)

    out.writeByte(lzwMinCodeSize)

    let offset = 0
    while (raster.length - offset > 255) {
      out.writeByte(255)
      out.writeBytes(raster, offset, 255)
      offset += 255
    }

    out.writeByte(raster.length - offset)
    out.writeBytes(raster, offset, raster.length - offset)
    out.writeByte(0x00)

    out.writeString(';') // GIF Signature End
  }

  return res
}

export default GIFImage
