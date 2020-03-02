import * as ts from 'typescript';
export declare class GenerateSchema {
    output: DocEntry[];
    private program;
    private compilerOptions;
    private checker;
    constructor(fileNames: string[], options: ts.CompilerOptions);
    compile(): GenerateSchema;
    write(spaces?: number): Promise<void>;
    private visitPlain;
    private serializeClass;
    private serializeFunction;
    private serializeSignature;
    private serializeSymbol;
    private isNodeExported;
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
