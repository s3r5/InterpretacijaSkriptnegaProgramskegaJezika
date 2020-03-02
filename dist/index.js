"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
const GenerateSchema_1 = require("./lib/GenerateSchema");
const schema = new GenerateSchema_1.GenerateSchema(process.argv.slice(2), {
    target: ts.ScriptTarget.ES5,
    module: ts.ModuleKind.CommonJS
});
schema.compile();
schema
    .write()
    .then(() => console.log('Completed Schema Generation'))
    .catch(() => null);
//# sourceMappingURL=index.js.map