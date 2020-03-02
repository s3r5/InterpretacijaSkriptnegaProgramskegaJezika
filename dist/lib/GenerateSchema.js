"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
const fsn = require("fs-nextra");
class GenerateSchema {
    constructor(fileNames, options) {
        this.output = [];
        this.compilerOptions = options;
        this.program = ts.createProgram(fileNames, this.compilerOptions);
        this.checker = this.program.getTypeChecker();
    }
    compile() {
        for (const sourceFile of this.program.getSourceFiles()) {
            if (!sourceFile.isDeclarationFile) {
                ts.forEachChild(sourceFile, node => this.visitPlain(node));
            }
        }
        return this;
    }
    async write(spaces = 4) {
        await fsn.writeFile('classes.json', JSON.stringify(this.output, undefined, spaces));
    }
    visitPlain(node) {
        if (!this.isNodeExported(node))
            return;
        if (ts.isClassDeclaration(node) && node.name) {
            const symbol = this.checker.getSymbolAtLocation(node.name);
            if (symbol) {
                this.output.push(this.serializeClass(symbol));
            }
        }
        else if (ts.isFunctionDeclaration(node) && node.name) {
            const symbol = this.checker.getSymbolAtLocation(node.name);
            if (symbol) {
                this.output.push(this.serializeFunction(symbol));
            }
        }
        else if (ts.isModuleDeclaration(node)) {
            ts.forEachChild(node, node => this.visitPlain(node));
        }
    }
    serializeClass(symbol) {
        const details = this.serializeSymbol(symbol);
        const constructorType = this.checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
        details.constructors = constructorType
            .getConstructSignatures()
            .map(value => this.serializeSignature(value));
        return details;
    }
    serializeFunction(symbol) {
        return {
            parameters: symbol.valueDeclaration.parameters.map(value => ({
                name: value.name.text,
                type: value.type.typeName.escapedText.toString()
            })),
            ...this.serializeSymbol(symbol)
        };
    }
    serializeSignature(signature) {
        return {
            parameters: signature.parameters.map(value => this.serializeSymbol(value)),
            returnType: this.checker.typeToString(signature.getReturnType()),
            documentation: ts.displayPartsToString(signature.getDocumentationComment(this.checker))
        };
    }
    serializeSymbol(symbol) {
        const { type } = symbol.declarations[0];
        const typeName = type ? type.typeName : undefined;
        const escaped = typeName ? typeName.escapedText : undefined;
        return {
            name: symbol.getName(),
            documentation: ts.displayPartsToString(symbol.getDocumentationComment(this.checker)),
            type: (escaped && escaped !== 'error') ? escaped.toString() : this.checker.typeToString(this.checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration))
        };
    }
    isNodeExported(node) {
        return (
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0
            || (Boolean(node.parent) && node.parent.kind === ts.SyntaxKind.SourceFile));
    }
}
exports.GenerateSchema = GenerateSchema;
//# sourceMappingURL=GenerateSchema.js.map