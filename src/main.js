import qrcode from './qrcode/index'

const typeNumber = 8
const errorCorrectionLevel = 'L'
const qr = qrcode(typeNumber, errorCorrectionLevel)
qr.addData('https://nikoni.top/vui-vc-next/').make()

document.querySelector('#app').innerHTML = `
<center>
  <h3>QR Code - VUI</h3>
  <p>Image</p>
  ${qr.createImgTag()}
  <hr/><p>SVG</p>
  ${qr.createSvgTag()}
  <hr/><p>Table</p>
  ${qr.createTableTag()}
  <hr/><p>ASCII</p>
  ${qr.createASCII()}
  <hr/><p>DataURL</p>
  ${qr.createDataURL()}
</center>
`
