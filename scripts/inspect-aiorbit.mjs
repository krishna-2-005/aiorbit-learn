// Phase 0: capture AI Orbit's visual language so the Learn module copies it.
// Usage: node scripts/inspect-aiorbit.mjs  -> docs/reference/*.jpg + docs/reference/tokens.json
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const pages = [
  ["home", "https://aiorbit.club/"],
  ["learn", "https://aiorbit.club/learn"],
  ["tools", "https://aiorbit.club/tools"],
  ["tool-detail", "https://aiorbit.club/tools/chatgpt"],
  ["companies", "https://aiorbit.club/companies"],
  ["business", "https://aiorbit.club/business"],
];

await mkdir("docs/reference", { recursive: true });
const browser = await chromium.launch();
const report = {};

for (const [name, url] of pages) {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    try {
      const response = await page.goto(url, { waitUntil: "load", timeout: 45_000 }).catch(() => null);
      await page.waitForTimeout(2500);
      await page.screenshot({ path: `docs/reference/${name}-${width}.jpg`, fullPage: true, type: "jpeg", quality: 60 });
      if (width !== 1440) continue;
      report[name] = await page.evaluate(() => {
        const pick = (el, props) => {
          if (!el) return null;
          const cs = getComputedStyle(el);
          return Object.fromEntries(props.map((p) => [p, cs.getPropertyValue(p)]));
        };
        const text = ["color", "font-family", "font-size", "font-weight", "line-height", "letter-spacing"];
        const box = ["background-color", "background-image", "border-top-color", "border-top-width", "border-radius", "padding", "height", "box-shadow", "backdrop-filter"];
        const firstVisible = (sel) => [...document.querySelectorAll(sel)].find((el) => el.getBoundingClientRect().height > 0);
        // Cards: bordered elements with a link or heading inside, roughly card sized.
        const cards = [...document.querySelectorAll("a, div, article")]
          .filter((el) => {
            const cs = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            return parseFloat(cs.borderTopWidth) > 0 && parseFloat(cs.borderRadius) > 0 && r.width > 200 && r.width < 500 && r.height > 80 && r.height < 600;
          })
          .slice(0, 4)
          .map((el) => ({ className: el.className?.toString().slice(0, 300), ...pick(el, [...box, "width"]) }));
        const buttons = [...document.querySelectorAll("button, a")]
          .filter((el) => { const cs = getComputedStyle(el); return cs.backgroundColor !== "rgba(0, 0, 0, 0)" && el.getBoundingClientRect().height > 24 && el.getBoundingClientRect().height < 60; })
          .slice(0, 6)
          .map((el) => ({ text: el.textContent?.trim().slice(0, 30), className: el.className?.toString().slice(0, 200), ...pick(el, [...box, ...text]) }));
        const muted = [...document.querySelectorAll("p, span")].map((el) => getComputedStyle(el).color);
        const colorCounts = {};
        for (const c of muted) colorCounts[c] = (colorCounts[c] ?? 0) + 1;
        const bgCounts = {};
        for (const el of document.querySelectorAll("*")) {
          const bg = getComputedStyle(el).backgroundColor;
          if (bg !== "rgba(0, 0, 0, 0)") bgCounts[bg] = (bgCounts[bg] ?? 0) + 1;
        }
        const borderCounts = {};
        for (const el of document.querySelectorAll("*")) {
          const cs = getComputedStyle(el);
          if (parseFloat(cs.borderTopWidth) > 0) borderCounts[cs.borderTopColor] = (borderCounts[cs.borderTopColor] ?? 0) + 1;
        }
        const radiusCounts = {};
        for (const el of document.querySelectorAll("*")) {
          const r = getComputedStyle(el).borderRadius;
          if (r !== "0px") radiusCounts[r] = (radiusCounts[r] ?? 0) + 1;
        }
        const header = document.querySelector("header, nav");
        const input = firstVisible("input");
        const main = firstVisible("main > div, main");
        return {
          title: document.title,
          html: pick(document.documentElement, ["background-color", "color-scheme"]),
          body: pick(document.body, ["background-color", ...text]),
          h1: pick(firstVisible("h1"), text),
          h1Text: firstVisible("h1")?.textContent?.slice(0, 80),
          h2: pick(firstVisible("h2"), text),
          h3: pick(firstVisible("h3"), text),
          header: header ? { ...pick(header, [...box, "position"]), rectHeight: header.getBoundingClientRect().height } : null,
          input: input ? { placeholder: input.placeholder, ...pick(input, [...box, ...text]) } : null,
          main: main ? { ...pick(main, ["max-width", "padding-left", "padding-right"]), width: main.getBoundingClientRect().width } : null,
          cards,
          buttons,
          textColors: Object.entries(colorCounts).sort((a, b) => b[1] - a[1]).slice(0, 8),
          backgrounds: Object.entries(bgCounts).sort((a, b) => b[1] - a[1]).slice(0, 10),
          borders: Object.entries(borderCounts).sort((a, b) => b[1] - a[1]).slice(0, 8),
          radii: Object.entries(radiusCounts).sort((a, b) => b[1] - a[1]).slice(0, 8),
          fonts: [...new Set([...document.querySelectorAll("*")].map((el) => getComputedStyle(el).fontFamily))].slice(0, 5),
          bodyText: document.body.innerText.slice(0, 1500),
        };
      });
      report[name].status = response?.status() ?? null;
      console.log(`inspected ${name} (${report[name].status})`);
    } catch (error) {
      console.log(`failed ${name} @${width}: ${error.message}`);
    } finally {
      await page.close();
    }
  }
}

await browser.close();
await writeFile("docs/reference/tokens.json", JSON.stringify(report, null, 2));
console.log("wrote docs/reference/tokens.json");
