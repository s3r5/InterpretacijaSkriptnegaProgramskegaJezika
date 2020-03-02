import * as ts from 'typescript';
import * as fsn from 'fs-nextra';

export class GenerateSchema {

	public output: DocEntry[] = [];

	private program: ts.Program;
	private compilerOptions: ts.CompilerOptions;
	private checker: ts.TypeChecker;

	public constructor(fileNames: string[], options: ts.CompilerOptions) {
		this.compilerOptions = options;

		this.program = ts.createProgram(fileNames, this.compilerOptions);
		this.checker = this.program.getTypeChecker();
	}

	public compile(): GenerateSchema {
		for (const sourceFile of this.program.getSourceFiles()) {
			if (!sourceFile.isDeclarationFile) {
				ts.forEachChild(sourceFile, node => this.visitPlain(node));
			}
		}

		return this;
	}

	public async write(spaces = 4): Promise<void> {
		await fsn.writeFile('classes.json', JSON.stringify(this.output, undefined, spaces));
	}

	private visitPlain(node: ts.Node) {
		if (!this.isNodeExported(node)) return;
		if (ts.isClassDeclaration(node) && node.name) {
			const symbol = this.checker.getSymbolAtLocation(node.name);
			if (symbol) {
				this.output.push(this.serializeClass(symbol));
			}
		} else if (ts.isFunctionDeclaration(node) && node.name) {
			const symbol = this.checker.getSymbolAtLocation(node.name);
			if (symbol) {
				this.output.push(this.serializeFunction(symbol));
			}
		} else if (ts.isModuleDeclaration(node)) {
			ts.forEachChild(node, node => this.visitPlain(node));
		}
	}

	private serializeClass(symbol: ts.Symbol): DocEntry {
		const details: DocEntry = this.serializeSymbol(symbol);

		const constructorType: ts.Type = this.checker.getTypeOfSymbolAtLocation(
			symbol,
			symbol.valueDeclaration!
		);
		details.constructors = constructorType
			.getConstructSignatures()
			.map(value => this.serializeSignature(value));
		return details;
	}

	private serializeFunction(symbol: ts.Symbol): DocEntry {
		return {
			parameters: (symbol.valueDeclaration! as ts.FunctionDeclaration).parameters.map(value => ({
				name: (value.name as ts.Identifier).text,
				type: ((value.type as ts.TypeReferenceNode).typeName as ts.Identifier).escapedText.toString()
			})),
			...this.serializeSymbol(symbol)
		};
	}

	private serializeSignature(signature: ts.Signature): DocEntry {
		return {
			parameters: signature.parameters.map(value => this.serializeSymbol(value)),
			returnType: this.checker.typeToString(signature.getReturnType()),
			documentation: ts.displayPartsToString(signature.getDocumentationComment(this.checker))
		};
	}

	private serializeSymbol(symbol: ts.Symbol): DocEntry {

		const { type }: { type?: ts.TypeNode } = (symbol.declarations[0] as ts.ParameterDeclaration);
		const typeName: ts.EntityName | undefined = type ? (type as ts.TypeReferenceNode).typeName : undefined;
		const escaped: ts.__String | undefined = typeName ? (typeName as ts.Identifier).escapedText : undefined;

		return {
			name: symbol.getName(),
			documentation: ts.displayPartsToString(symbol.getDocumentationComment(this.checker)),
			type: (escaped && escaped !== 'error') ? escaped.toString() : this.checker.typeToString(this.checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!))
		};
	}

	private isNodeExported(node: ts.Node): boolean {
		return (
			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			(ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0
			|| (Boolean(node.parent) && node.parent.kind === ts.SyntaxKind.SourceFile)
		);
	}

}

export interface DocEntry {
	name?: string;
	fileName?: string;
	documentation?: string;
	type?: string;
	constructors?: DocEntry[];
	parameters?: DocEntry[];
	returnType?: string;
}
