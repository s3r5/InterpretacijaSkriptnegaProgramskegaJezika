import * as ts from 'typescript';
import { GenerateSchema } from './lib/GenerateSchema';

const schema = new GenerateSchema(process.argv.slice(2), {
	target: ts.ScriptTarget.ES5,
	module: ts.ModuleKind.CommonJS
});
schema.compile();

schema
	.write()
	.then(() => console.log('Completed Schema Generation'))
	.catch(() => null);

