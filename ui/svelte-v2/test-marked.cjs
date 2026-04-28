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
const sanitized = DOMPurify.sanitize(raw);
console.log("Sanitized output:");
console.log(sanitized);
