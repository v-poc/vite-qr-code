# vite-qr-code

[![npm](https://img.shields.io/npm/v/v-qr-code-next)](https://www.npmjs.com/package/v-qr-code-next)

## INTRODUCTION

The qrcode package is based on Vite 5. Try [StackBlitz](https://stackblitz.com/github/v-poc/vite-qr-code?file=package.json) or try [SFC playground](https://play.vuejs.org/#eNp9Uctu2zAQ/BVCFzuARRUNUBSGErRNc0gRpEWboy6KtJFpiw8vl4qDwP/eJRUrcZD2Ru7MLGeGT9lX5+QQIFtmJYF2fU1wXhkhylYNYshXpPuzKlO6q7LzsuAho2XxispX36ByJDxQcDxR2lkkscXGtiDu0WoxG/It5vGeG9jRLMoaazwJenRwE/QdoDgTnxcCEC1eWERoSFlzDQP0jMyuWTMqtpE5Lp+/qN9XnlRmi7Ju2+811fPZisj5ZVEYtbFGSbKuwKCSpWJ2InW9gTlLDi9x6vSUbBA47JXubusuEspijMxhswWXE/PmunZy7a3hKp9ig7G1CPgqW4o0ibPjIiJUZQdbwbhNJxuri2PWlw/yo/zE5Xt6g0jw/GaVLab1AY538jc9xg9ee2mxK/gkMRhSGlir8zu0Dx4wLYk79pXZcyTy3MC96t4EYmtO9YA/XWz4OFjd9/bhR5oRBpgcNStoNu/M1343Ov2FwA4G9j1hVGMHz+Vc/rlJRU2gtm3on1P+A/wN3vYhehxp34Jp2fYrXnJ7lf5Hme7WX+4IjD+EikZTG4mfWr34T/QXu6fydGpx/xc0hiOM).

> This is a lightweight demo to use template-vanilla of [create-vite](https://github.com/vitejs/vite/tree/main/packages/create-vite).

## Usage

```js
import qrcode from "v-qr-code-next";

const typeNumber = 8;
const errorCorrectionLevel = "L";
const qr = qrcode(typeNumber, errorCorrectionLevel);
qr.addData("Hello VUI!").make();

document.querySelector("#app").innerHTML = `
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
`;
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
