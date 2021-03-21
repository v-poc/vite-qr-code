# vite-qr-code

## INTRODUCTION

The qrcode based on Vite 2.

> This is a lightweight demo to use template-vanilla of [@vite/create-app](https://github.com/vitejs/vite/tree/main/packages/create-app).

## Usage

```js
import qrcode from 'v-qr-code-next'

const typeNumber = 8
const errorCorrectionLevel = 'L'
const qr = qrcode(typeNumber, errorCorrectionLevel)
qr.addData('Hello VUI!').make()

document.querySelector('#app').innerHTML = `
<center>
  <h5>QR Code</h5>
  ${qr.createImgTag()}
</center>
`
```

## Project setup

### How to setup your project
```
npm install
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

<img src="https://nikoni.top/images/niko-mit.png" alt="MIT License" width="396" height="250"/>
