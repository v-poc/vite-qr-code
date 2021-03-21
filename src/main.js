import qrcode from './qrcode/index'

const typeNumber = 8
const errorCorrectionLevel = 'L'
const qr = qrcode(typeNumber, errorCorrectionLevel)
qr.addData('https://nikoni.top/vui-vc-next/').make()

document.querySelector('#app').innerHTML = `
<center>
  <h5>QR Code - VUI</h5>
  ${qr.createImgTag()}
</center>
`
