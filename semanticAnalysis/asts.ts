/**
 * This fils contains all the AST classes.
 */

import { PrimitiveType } from "../lexer/types";

export interface ASTThatHasJoeDoc {
	joeDoc: ASTJoeDoc | undefined;
}

export interface ASTThatHasModifiers {
	modifiers: ASTModifier[];
}

export interface ASTThatHasRequiredBody {
	body: ASTBlockStatement;
}

export interface ASTThatHasTypeParams {
	typeParams: ASTType[];
}

export interface AST { }

export class ASTArgumentsList implements AST {
	args: AssignableASTs[] = []; // usually this is empty and thus undefined, but the parser ensures it's an array, so we mimic that here

	// factory function
	static _(args: AssignableASTs[]): ASTArgumentsList {
		const ast = new ASTArgumentsList();
		ast.args = args;
		return ast;
	}
}

export class ASTArrayExpression implements AST {
	/** The type, usually inferred from the initial value, if any, or from context */
	type: ASTType | undefined = undefined;
	items: AssignableASTs[] = []; // usually this would be empty and thus undefined, but the parser ensures it's an array, so we mimic that here

	// factory function
	static _({ type, items }: { type?: ASTType; items: AssignableASTs[]; }): ASTArrayExpression {
		const ast = new ASTArrayExpression();
		ast.type = type;
		ast.items = items;
		return ast;
	}
}

export class ASTAssignmentExpression implements AST {
	left!: ASTIdentifier | ASTMemberExpression;
	right!: AssignableASTs;

	// factory function
	static _({ left, right }: {
		left: ASTIdentifier | ASTMemberExpression;
		right: AssignableASTs;
	}): ASTAssignmentExpression {
		const ast = new ASTAssignmentExpression();
		ast.left = left;
		ast.right = right;
		return ast;
	}
}

export class ASTBinaryExpression<L, R> implements AST {
	operator!: string;
	left!: L;
	right!: R;

	// factory function
	static _<L, R>({ operator, left, right }: { operator: string; left: L; right: R; }): ASTBinaryExpression<L, R> {
		const ast = new ASTBinaryExpression<L, R>();
		ast.operator = operator;
		ast.left = left;
		ast.right = right;
		return ast;
	}
}

export class ASTBlockStatement implements AST {
	expressions: AST[] = [];

	// factory function
	static _(expressions: AST[]): ASTBlockStatement {
		const ast = new ASTBlockStatement();
		ast.expressions = expressions;
		return ast;
	}
}

export class ASTBoolLiteral implements AST {
	value!: boolean | ASTUnaryExpression<boolean>;

	// factory function
	static _(value: boolean | ASTUnaryExpression<boolean>): ASTBoolLiteral {
		const ast = new ASTBoolLiteral();
		ast.value = value;
		return ast;
	}
}

export class ASTCallExpression implements AST {
	callee!: ASTIdentifier | ASTMemberExpression;
	typeArgs!: ASTType[];
	args!: Expression[];

	// factory function
	static _({ callee, typeArgs, args }: { callee: ASTIdentifier | ASTMemberExpression; typeArgs?: ASTType[]; args: Expression[]; }): ASTCallExpression {
		const ast = new ASTCallExpression();
		ast.callee = callee;

		if (typeArgs) {
			ast.typeArgs = typeArgs;
		}

		ast.args = args;
		return ast;
	}
}

export class ASTClassDeclaration implements AST, ASTThatHasJoeDoc, ASTThatHasModifiers, ASTThatHasRequiredBody, ASTThatHasTypeParams {
	joeDoc: ASTJoeDoc | undefined;
	modifiers: ASTModifier[] = [];
	name!: ASTIdentifier;
	typeParams: ASTType[] = [];
	extends: ASTTypeExceptPrimitive[] = [];
	implements: ASTTypeExceptPrimitive[] = [];
	body!: ASTBlockStatement;

	// factory function
	static _({ joeDoc, modifiers, name, typeParams, extends: _extends, implements: _implements, body }: {
		joeDoc?: ASTJoeDoc;
		modifiers: ASTModifier[];
		name: ASTIdentifier;
		typeParams: ASTType[];
		extends: ASTTypeExceptPrimitive[];
		implements: ASTTypeExceptPrimitive[];
		body: ASTBlockStatement;
	}): ASTClassDeclaration {
		const ast = new ASTClassDeclaration();

		if (typeof joeDoc !== 'undefined') { // only set if it's defined
			ast.joeDoc = joeDoc;
		}

		ast.modifiers = modifiers;
		ast.name = name;
		ast.typeParams = typeParams;
		ast.extends = _extends;
		ast.implements = _implements;
		ast.body = body;
		return ast;
	}
}

export class ASTFunctionDeclaration implements AST, ASTThatHasJoeDoc, ASTThatHasModifiers, ASTThatHasTypeParams {
	joeDoc: ASTJoeDoc | undefined;
	modifiers: ASTModifier[] = [];
	name: ASTIdentifier | undefined = undefined;
	typeParams: ASTType[] = [];
	params: ASTParameter[] = [];
	returnTypes: ASTType[] = [];
	body: ASTBlockStatement | undefined = undefined;

	// factory function
	static _({ joeDoc, modifiers, name, typeParams, params, returnTypes, body }: {
		joeDoc?: ASTJoeDoc;
		modifiers: ASTModifier[];
		name: ASTIdentifier | undefined;
		typeParams: ASTType[];
		params: ASTParameter[];
		returnTypes: ASTType[];
		body: ASTBlockStatement | undefined;
	}): ASTFunctionDeclaration {
		const ast = new ASTFunctionDeclaration();

		if (typeof joeDoc !== 'undefined') { // only set if it's defined
			ast.joeDoc = joeDoc;
		}

		ast.modifiers = modifiers;
		ast.name = name;
		ast.typeParams = typeParams;
		ast.params = params;
		ast.returnTypes = returnTypes;
		ast.body = body;
		return ast;
	}
}

export class ASTFunctionType implements AST, ASTThatHasTypeParams {
	typeParams: ASTType[] = [];
	params: ASTParameter[] = [];
	returnTypes: ASTType[] = [];

	// factory function
	static _({ typeParams, params, returnTypes }: {
		typeParams: ASTType[];
		params: ASTParameter[];
		returnTypes: ASTType[];
	}): ASTFunctionType {
		const ast = new ASTFunctionType();
		ast.typeParams = typeParams;
		ast.params = params;
		ast.returnTypes = returnTypes;
		return ast;
	}
}

export class ASTIdentifier implements AST {
	name!: string;

	// factory function
	static _(name: string): ASTIdentifier {
		const ast = new ASTIdentifier();
		ast.name = name;
		return ast;
	}
}

export class ASTIfStatement implements AST {
	test!: Expression;
	consequent!: ASTBlockStatement;
	alternate?: ASTBlockStatement | ASTIfStatement = undefined;

	// factory function
	static _({ test, consequent, alternate }: {
		test: Expression;
		consequent: ASTBlockStatement;
		alternate?: ASTBlockStatement | ASTIfStatement;
	}): ASTIfStatement {
		const ast = new ASTIfStatement();
		ast.test = test;
		ast.consequent = consequent;

		if (alternate) { // only set if it's not undefined
			ast.alternate = alternate;
		}

		return ast;
	}
}

export class ASTInterfaceDeclaration implements AST, ASTThatHasJoeDoc, ASTThatHasModifiers, ASTThatHasRequiredBody, ASTThatHasTypeParams {
	joeDoc: ASTJoeDoc | undefined;
	modifiers: ASTModifier[] = [];
	name!: ASTIdentifier;
	typeParams: ASTType[] = [];
	extends: ASTTypeExceptPrimitive[] = [];
	body!: ASTBlockStatement;

	// factory function
	static _({ joeDoc, modifiers, name, typeParams, extends: _extends, body }: {
		joeDoc?: ASTJoeDoc;
		modifiers: ASTModifier[];
		name: ASTIdentifier;
		typeParams: ASTType[];
		extends: ASTTypeExceptPrimitive[];
		body: ASTBlockStatement;
	}): ASTInterfaceDeclaration {
		const ast = new ASTInterfaceDeclaration();

		if (typeof joeDoc !== 'undefined') { // only set if it's defined
			ast.joeDoc = joeDoc;
		}

		ast.modifiers = modifiers;
		ast.name = name;
		ast.typeParams = typeParams;
		ast.extends = _extends;
		ast.body = body;
		return ast;
	}
}

export class ASTJoeDoc implements AST {
	content?: string = undefined; // TODO parse into parts

	// factory function
	static _(content?: string): ASTJoeDoc {
		const ast = new ASTJoeDoc();
		ast.content = content;
		return ast;
	}
}

export class ASTMemberExpression implements AST {
	object!: ASTIdentifier | ASTMemberExpression | ASTThisKeyword; // TODO add ASTCallExpression
	property!: ASTIdentifier | ASTTypeInstantiationExpression;

	// factory function
	static _({ object, property }: {
		object: ASTIdentifier | ASTMemberExpression | ASTThisKeyword;
		property: ASTIdentifier | ASTTypeInstantiationExpression;
	}): ASTMemberExpression {
		const ast = new ASTMemberExpression();
		ast.object = object;
		ast.property = property;
		return ast;
	}
}

export class ASTModifier implements AST {
	keyword!: string;

	// factory function
	static _(keyword: string): ASTModifier {
		const ast = new ASTModifier();
		ast.keyword = keyword;
		return ast;
	}
}

export class ASTNumberLiteral implements AST {
	format!: 'int' | 'decimal';
	value!: number | ASTUnaryExpression<number>;

	// factory function
	static _({ format, value }: { format: 'int' | 'decimal'; value: number | ASTUnaryExpression<number>; }): ASTNumberLiteral {
		const ast = new ASTNumberLiteral();
		ast.format = format;
		ast.value = value;
		return ast;
	}
}

export class ASTObjectExpression implements AST { }

export class ASTParameter implements AST {
	modifiers: ASTModifier[] = [];
	isRest = false;
	name!: ASTIdentifier;

	/** The type declared by the source code, if any */
	declaredType?: ASTType;

	/** The type inferred from the initial value, if any */
	inferredType?: ASTType;

	defaultValue?: AssignableASTs;

	// factory function
	static _({ modifiers, isRest, name, declaredType, inferredType, defaultValue }: {
		modifiers: ASTModifier[];
		isRest: boolean;
		name: ASTIdentifier;
		declaredType?: ASTType;
		inferredType?: ASTType;
		defaultValue?: AssignableASTs;
	}): ASTParameter {
		const ast = new ASTParameter();
		ast.modifiers = modifiers;
		ast.isRest = isRest;
		ast.name = name;

		if (typeof declaredType !== 'undefined') { // only set if it's not undefined
			ast.declaredType = declaredType;
		}

		if (typeof inferredType !== 'undefined') { // only set if it's not undefined
			ast.inferredType = inferredType;
		}

		if (typeof defaultValue !== 'undefined') { // only set if it's not undefined
			ast.defaultValue = defaultValue;
		}

		return ast;
	}
}

export class ASTPath implements AST {
	absolute!: boolean;
	path!: string;
	isDir!: boolean;

	// factory function
	static _({ absolute, path, isDir }: { absolute: boolean; path: string; isDir: boolean; }): ASTPath {
		const ast = new ASTPath();
		ast.absolute = absolute;
		ast.path = path;
		ast.isDir = isDir;
		return ast;
	}
}

export class ASTPostfixIfStatement implements AST {
	expression!: Expression;
	test!: Expression;

	// factory function
	static _({ expression, test }: {
		expression: Expression;
		test: Expression;
	}): ASTPostfixIfStatement {
		const ast = new ASTPostfixIfStatement();
		ast.expression = expression;
		ast.test = test;
		return ast;
	}
}

export class ASTPrintStatement implements AST {
	expressions: Expression[] = [];

	// factory function
	static _(expressions: Expression[]): ASTPrintStatement {
		const ast = new ASTPrintStatement();
		ast.expressions = expressions;
		return ast;
	}
}

/** It's just a kind of BlockStatement */
export class ASTProgram implements AST {
	declarations: AST[] = [];

	// factory function
	static _({ declarations }: {
		declarations: AST[];
	}): ASTProgram {
		const ast = new ASTProgram();

		ast.declarations = declarations;

		return ast;
	}
}

export class ASTRangeExpression implements AST {
	lower!: RangeBound;
	upper!: RangeBound;

	// factory function
	static _({ lower, upper }: {
		lower: RangeBound;
		upper: RangeBound;
	}): ASTRangeExpression {
		const ast = new ASTRangeExpression();
		ast.lower = lower;
		ast.upper = upper;
		return ast;
	}
}

export class ASTRegularExpression implements AST {
	pattern!: string;
	flags!: string[];

	// factory function
	static _({ pattern, flags }: { pattern: string; flags: string[]; }): ASTRegularExpression {
		const ast = new ASTRegularExpression();
		ast.pattern = pattern;
		ast.flags = flags;
		return ast;
	}
}

export class ASTRestElement implements AST {
	// factory function
	static _(): ASTRestElement {
		return new ASTRestElement();
	}
}

export class ASTReturnStatement implements AST {
	expressions: AssignableASTs[] = [];

	// factory function
	static _(expressions: AssignableASTs[]): ASTReturnStatement {
		const ast = new ASTReturnStatement();
		ast.expressions = expressions;
		return ast;
	}
}

export class ASTStringLiteral implements AST {
	value!: string;

	// factory function
	static _(value: string): ASTStringLiteral {
		const ast = new ASTStringLiteral();
		ast.value = value;
		return ast;
	}
}

export class ASTThisKeyword implements AST {
	// factory function
	static _(): ASTThisKeyword {
		return new ASTThisKeyword();
	}
}

export class ASTTupleExpression implements AST { }

/** Begin ASTType */
export class ASTTypePrimitive {
	type!: PrimitiveType;

	// factory function
	static _(type: PrimitiveType): ASTTypePrimitive {
		const ast = new ASTTypePrimitive();
		ast.type = type;
		return ast;
	}
}
export class ASTTypeInstantiationExpression {
	base!: ASTIdentifier | ASTMemberExpression;
	typeArgs: ASTType[] = [];

	// factory function
	static _({ base, typeArgs }: {
		base: ASTIdentifier | ASTMemberExpression;
		typeArgs: ASTType[];
	}): ASTTypeInstantiationExpression {
		const ast = new ASTTypeInstantiationExpression();
		ast.base = base;
		ast.typeArgs = typeArgs;
		return ast;
	}
}
export const ASTTypePrimitiveBool = new ASTTypePrimitive();
ASTTypePrimitiveBool.type = 'bool';
export const ASTTypePrimitiveNumber = new ASTTypePrimitive();
ASTTypePrimitiveNumber.type = 'number';
export const ASTTypePrimitivePath = new ASTTypePrimitive();
ASTTypePrimitivePath.type = 'path';
export const ASTTypePrimitiveRegex = new ASTTypePrimitive();
ASTTypePrimitiveRegex.type = 'regex';
export const ASTTypePrimitiveString = new ASTTypePrimitive();
ASTTypePrimitiveString.type = 'string';

export type ASTTypeExceptPrimitive = ASTFunctionType | ASTIdentifier | ASTMemberExpression | ASTTypeInstantiationExpression;
export type ASTType = ASTTypePrimitive | ASTTypeExceptPrimitive;
/** End ASTType */

export class ASTUnaryExpression<T> implements AST {
	before!: boolean;
	operator!: string;
	operand!: T;

	// factory function
	static _<T>({ before, operator, operand }: { before: boolean; operator: string; operand: T; }): ASTUnaryExpression<T> {
		const ast = new ASTUnaryExpression<T>();
		ast.before = before;
		ast.operator = operator;
		ast.operand = operand;
		return ast;
	}
}

export class ASTVariableDeclaration implements AST, ASTThatHasJoeDoc, ASTThatHasModifiers {
	joeDoc: ASTJoeDoc | undefined;
	modifiers: ASTModifier[] = [];
	mutable!: boolean;
	identifier!: ASTIdentifier;

	/** The type declared by the source code, if any */
	declaredType?: ASTType;

	/** The type inferred from the initial value, if any */
	inferredType?: ASTType;

	initialValue?: AssignableASTs;

	// factory function
	static _({ joeDoc, modifiers, mutable, identifier, declaredType, inferredType, initialValue }: {
		joeDoc?: ASTJoeDoc;
		modifiers: ASTModifier[];
		mutable: boolean;
		identifier: ASTIdentifier;
		declaredType?: ASTType;
		inferredType?: ASTType;
		initialValue?: AssignableASTs;
	}): ASTVariableDeclaration {
		const ast = new ASTVariableDeclaration();

		if (typeof joeDoc !== 'undefined') { // only set if it's defined
			ast.joeDoc = joeDoc;
		}

		ast.modifiers = modifiers;
		ast.mutable = mutable;
		ast.identifier = identifier;

		if (declaredType) { // only set if it's not undefined
			ast.declaredType = declaredType;
		}

		if (inferredType) { // only set if it's not undefined
			ast.inferredType = inferredType;
		}

		if (initialValue) { // only set if it's not undefined
			ast.initialValue = initialValue;
		}

		return ast;
	}
}

export class ASTWhenCase implements AST {
	values: Array<ASTBoolLiteral | ASTNumberLiteral | ASTRangeExpression | ASTRestElement | ASTStringLiteral> = [];
	consequent!: ASTBlockStatement | AssignableASTs;

	// factory function
	static _({ values, consequent }: {
		values: Array<ASTBoolLiteral | ASTNumberLiteral | ASTRangeExpression | ASTRestElement | ASTStringLiteral>;
		consequent: ASTBlockStatement | AssignableASTs;
	}): ASTWhenCase {
		const ast = new ASTWhenCase();
		ast.values = values;
		ast.consequent = consequent;
		return ast;
	}
}

export class ASTWhenExpression implements AST {
	expression!: Expression;
	cases: ASTWhenCase[] = [];

	// factory function
	static _({ expression, cases }: { expression: Expression; cases: ASTWhenCase[]; }): ASTWhenExpression {
		const ast = new ASTWhenExpression();
		ast.expression = expression;
		ast.cases = cases;
		return ast;
	}
}

// noop
export class Skip implements AST { }

/** ASTs that can be used in UnaryExpressions and BinaryExpressions */
export type Expression =
	ASTArrayExpression |
	ASTBinaryExpression<Expression, Expression> |
	ASTBoolLiteral |
	ASTCallExpression |
	ASTIdentifier |
	ASTMemberExpression |
	ASTNumberLiteral |
	ASTObjectExpression |
	ASTPath |
	ASTRegularExpression |
	ASTStringLiteral |
	ASTTupleExpression |
	ASTUnaryExpression<Expression> |
	ASTWhenExpression;

	/** ASTs that can be assigned to a variable or passed as an argument */
export type AssignableASTs = Expression | ASTFunctionDeclaration;

export type RangeBound = ASTCallExpression | ASTIdentifier | ASTMemberExpression | ASTNumberLiteral; // TODO add array access

export type ASTWhenCaseValue = ASTBoolLiteral | ASTCallExpression | ASTIdentifier | ASTMemberExpression | ASTNumberLiteral | ASTPath | ASTRangeExpression | ASTRegularExpression | ASTRestElement | ASTStringLiteral;
