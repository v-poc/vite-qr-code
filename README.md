# vite-qr-code

## INTRODUCTION

The qrcode package is based on Vite 4. Try [StackBlitz](https://stackblitz.com/github/v-poc/vite-qr-code?file=package.json) or try [SFC playground](https://sfc.vuejs.org/#eNp9UU1PAjEQ/StNL4sJ28rBxJCFaPRiQjx53MuyOywF+sF0dtUQ/rtTCCpgvLXzPqbvdScfQ1B9B3IsCwIbNhXBtHRCFI3pRZ8vyW4mpTS2LeW00DxktNC/qHyNNZpAIgJ1gSfGBo8ktlj7BsQCvRVZn28xT/fcwQdlSVZ7F0nQZ4DXzs4BxUTcDwUgenzyiFCT8W4GPWwYyWasOSq2iXk0H/yo/1belG6Lqmqa54qqQbYkCnGstTNr74wiHzR25vAknd0oW61hwJLTJk59WKVqBA77Ytu3qk2EQh8jc1g55HJS3txWQa2id1zlLjWYWktALOVYHCZpdl5Egkp5elbnwrpVtbf6nPVwq0ZqdMftR7qAFEReWsrht38H56ZxUacPXkXlsdV8Utg5MhZYavM5+vcIeOWhedgD5giuAQT8z/OCeuWbbPel28v9F1x42Wc=).

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
