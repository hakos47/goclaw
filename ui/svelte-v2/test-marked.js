const { marked } = require("marked");
const createDOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

marked.setOptions({
  gfm: true,
  breaks: true
});

const content = `Mapcarta: https://mapcarta.com/Vilalba
Callejero: https://vilalba.callejero.net/`;

const raw = marked.parse(content);
console.log("Raw marked output:");
console.log(raw);

const sanitized = DOMPurify.sanitize(raw);
console.log("\nSanitized output:");
console.log(sanitized);
