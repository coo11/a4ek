import express from "express";
import morgan from "morgan";
import axios from "axios";
import sharp from "sharp";
import sha256 from "crypto-js/sha256.js";
import wordArray from "crypto-js/lib-typedarrays.js";
import ekquery from "../emoji/query.js";
import e from "express";

const app = express();
app.use(morgan("dev"));
const port = process.env.PORT || 8080;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.get("/", async (req, res) => {
  res.status(200).send("Hello World!");
});

const transform = image => {
  const sharpObj = image.pipe(sharp());
  return new Promise(resolve => {
    sharpObj
      .trim()
      .toBuffer()
      .then(buffer => {
        const sObj = sharp(buffer);
        sObj.metadata().then((width, height) => {
          let base = width > height ? "width" : "height";
          resolve(
            sObj
              .resize({
                [base]: 512,
                fit: sharp.fit.contain,
                background: { r: 0, g: 0, b: 0, alpha: 0 },
                withoutEnlargement: true,
              })
              .webp({ lossless: true })
          );
        });
      });
  });
};

const calcHash = image => {
  const sharpObj = image.pipe(sharp());
  return new Promise(resolve => {
    sharpObj
      .raw()
      .toBuffer()
      .then(buffer => {
        resolve(sha256(wordArray.create(buffer)).toString());
      });
  });
};

/* app.get("/favicon.ico", (req, res) => { return res.status(404).end(); }); */

app.get("/emojikitchen", async (req, res) => {
  const { suffix, query } = req.query;
  if (!suffix && !query) return res.status(400).send();
  try {
    if (suffix) {
      const prefix = "https://www.gstatic.com/android/keyboard/emojikitchen/";
      const { data } = await axios({
        method: "GET",
        url: `${prefix}${suffix.replace(".webp", ".png")}`,
        responseType: "stream",
      });
      const transformed = await transform(data);
      res.setHeader("content-type", "image/webp");
      transformed.pipe(res);
    } else {
      const suffixStr = ekquery(query);
      res.status(200).send(suffixStr || "not found");
    }
  } catch (e) {
    res.status(404).send(e);
  }
});

async function calcHashFromUrl(url) {
  try {
    let newUrl = new URL(url),
      extra = {};
    if (newUrl.hostname.endsWith(".pximg.net")) {
      extra.headers = { Referer: "https://www.pixiv.net/" };
    }
    const { data, headers } = await axios({
      method: "GET",
      url,
      responseType: "stream",
      ...extra,
    });
    if (!/octet-stream|image/.test(headers["content-type"])) {
      return "Not an image";
    } else {
      return await calcHash(data);
    }
  } catch (e) {
    return e.toString();
  }
}

app.get("/sha256", async (req, res) => {
  let { url, urls } = req.query;
  if (!url && !urls) return res.status(400).send("Invalid Parameters");
  res.setHeader("content-type", "text/plain; charset=utf-8");
  if (url) {
    let result = await calcHashFromUrl(url);
    res.status(/^\w+$/.test(result) ? 200 : 400).send(result);
  } else {
    urls = urls.split(",");
    if (urls.length > 4) res.status(400).send("Too many urls to request");
    else {
      let results = [];
      for (let url of urls) {
        results.push(url);
        results.push(await calcHashFromUrl(url));
      }
      res.status(200).send(results.join("\n"));
    }
  }
});

app.listen(port, () => {
  console.log(`Started on port ${port}`);
});

export default app;
