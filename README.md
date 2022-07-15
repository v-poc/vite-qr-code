# vite-qr-code

## INTRODUCTION

The qrcode based on Vite 3. Try [SFC playground](https://sfc.vuejs.org/#eyJBcHAudnVlIjoiPHRlbXBsYXRlPlxuICA8ZGl2IHYtaHRtbD1cImltZ1wiPjwvZGl2PlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdCBzZXR1cD5cbmltcG9ydCBxcmNvZGUgZnJvbSAndi1xci1jb2RlLW5leHQnXG5cbmNvbnN0IHR5cGVOdW1iZXIgPSA4LCBlcnJvckNvcnJlY3Rpb25MZXZlbCA9ICdMJ1xuY29uc3QgcXIgPSBxcmNvZGUodHlwZU51bWJlciwgZXJyb3JDb3JyZWN0aW9uTGV2ZWwpXG5xci5hZGREYXRhKCdodHRwczovL25pa29uaS50b3AvdnVpLXZjLW5leHQvIy9idXR0b24tZGVtbycpLm1ha2UoKVxuXG5jb25zdCBpbWcgPSBxci5jcmVhdGVJbWdUYWcoKVxuPC9zY3JpcHQ+XG4iLCJpbXBvcnQtbWFwLmpzb24iOiJ7XG4gIFwiaW1wb3J0c1wiOiB7XG4gICAgXCJ2LXFyLWNvZGUtbmV4dFwiOiBcImh0dHBzOi8vdW5wa2cuY29tL3YtcXItY29kZS1uZXh0QDAuMS42L2Rpc3Qvdi1xci1jb2RlLW5leHQuZXMuanNcIlxuICB9XG59In0=).

> This is a lightweight demo to use template-vanilla of [@vite/create-vite](https://github.com/vitejs/vite/tree/main/packages/create-vite).

## Usage

```js
import qrcode from 'v-qr-code-next'

const typeNumber = 8
const errorCorrectionLevel = 'L'
const qr = qrcode(typeNumber, errorCorrectionLevel)
qr.addData('Hello VUI!').make()

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
```

## Project setup

### How to setup your project
```
npm i
```

### Compiles and hot-reloads for development
```
npm run dev
```

### Compiles and minifies for production
```
npm run build
```

### Customize configuration

About vite, please check Configuration Reference - [vite](https://vitejs.dev/config/).

## License

<img src="https://nikoni.top/images/niko-mit-vanilla-js.png" alt="MIT License" width="396" height="250"/>
