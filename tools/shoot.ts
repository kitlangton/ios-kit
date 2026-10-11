// Screenshot a page of a static server at @3x, for the fidelity loop.
//   python3 -m http.server 4791 &
//   PLAYWRIGHT=<dir with node_modules/playwright> bun tools/shoot.ts <path?query> <out.png> [width height]
// Pair it with side.py to put a render beside a simulator capture.
const pw = process.env.PLAYWRIGHT ? `${process.env.PLAYWRIGHT}/node_modules/playwright/index.mjs` : "playwright"
const { chromium } = await import(pw)
const [path = "index.html", out = "shot.png", width = "440", height = "956"] = process.argv.slice(2)
const port = process.env.PORT || "4791"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: +width, height: +height }, deviceScaleFactor: 3 })
const errors: string[] = []
page.on("pageerror", (e: Error) => errors.push(String(e)))
await page.goto(`http://127.0.0.1:${port}/${path}`)
await page.waitForTimeout(Number(process.env.WAIT ?? 900))
await page.screenshot({ path: out })
await browser.close()
if (errors.length) {
  console.error(errors.join("\n"))
  process.exit(1)
}
console.log(out)
