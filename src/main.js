import qrcode from 'v-qr-code-next'

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
  ${qr.createSvgTag(0, 0, 'svg', '', '#36C')}
  <hr/><p>Table</p>
  ${qr.createTableTag(0, 0, 'rgba(0, 0, 0, .5)')}
  <hr/><p>ASCII</p>
  ${qr.createASCII()}
  <hr/><p>DataURL</p>
  ${qr.createDataURL()}
</center>
`
