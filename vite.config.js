const path = require('path')

export default {
  build: {
    lib: {
      entry: path.resolve(__dirname, './src/qrcode/index.js'),
      name: 'VQrCode'
    }
  }
}
