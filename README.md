# vite-qr-code

## INTRODUCTION

The qrcode based on Vite 4. Try [StackBlitz](https://stackblitz.com/github/v-poc/vite-qr-code?file=package.json) or try [SFC playground](https://sfc.vuejs.org/#eNp9UU1PAjEQ/StNLwsJ28rNkIVo9GJCPHncy7I7LAX6wXR21RD+u1MIKmC8tfM+pu91Lx9DUH0HciILAhu2FcGsdEIUjelFn6/IbqelNLYt5azQPGS00L+ofI01mkAiAnWBJ8YGjyR2WPsGxBK9FVmf7zBP99zBB2VJVnsXSdBngNfOLgDFVNyPBCB6fPKIUJPxbg49bBnJ5qw5KXaJeTIf/Kj/Vg5Lt0NVNc1zRdUgWxGFONHamY13RpEPGjtzfJLOhspWGxiw5LyJUx9XqRqBw77Y9q1qE6HQp8gcVo64nJQ3t1VQ6+gdV7lPDabWEhBLORHHSZpdFpGgUp6f1bmwaVXtrb5kPdypsRqPuf1IVxBvLOXo27yDS8e4rNPvrqPy2Go+KewcGQsKos0X6N8j4I2H5mEPmCO4BhDwP88r6o1vsj2U7iAPX9HK2F0=).

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
