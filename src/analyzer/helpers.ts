import _ from 'lodash';
import { Node } from '../parser/types';
import { numberSizesSignedInts } from '../shared/numbers/sizes';
import {
	filterASTTypeNumbersWithBitCountsLowerThan,
	getLowestBitCountOf,
	getPossibleSizesFromNumberOrUnary,
} from '../shared/numbers/utils';
import { Result, ok } from '../shared/result';
import {
	AST,
	ASTArrayExpression,
	ASTArrayOf,
	ASTBinaryExpression,
	ASTBoolLiteral,
	ASTIdentifier,
	ASTNumberLiteral,
	ASTObjectExpression,
	ASTObjectShape,
	ASTPath,
	ASTPostfixIfStatement,
	ASTPropertyShape,
	ASTRangeExpression,
	ASTRegularExpression,
	ASTStringLiteral,
	ASTTernaryExpression,
	ASTTupleExpression,
	ASTTupleShape,
	ASTType,
	ASTTypeNumber,
	ASTTypePrimitiveBool,
	ASTTypePrimitivePath,
	ASTTypePrimitiveRegex,
	ASTTypePrimitiveString,
	ASTTypeRange,
	ASTUnaryExpression,
	AssignableASTs,
	ExpressionASTs,
	NumberSizesDecimalASTs,
	astUniqueness,
} from './asts';
import { SymbolTable } from './symbolTable';

/**
 * This function attempts to infer a type and if successful, run the assigner callback.
 *
 * Intentionally does not return an error if unable to infer anything. That is not an error scenario.
 *
 * Only returns an error if there is a problem in this.inferASTTypeFromASTAssignable()
 *
 * @see {@link inferPossibleASTTypesFromASTAssignable()}
 */
export function assignInferredPossibleTypes(
	valueAST: AssignableASTs,
	valueNode: Node,
	assigner: (possibleTypes: ASTType[]) => void,
	symbolTable: SymbolTable,
): Result<void> {
	// whether we got types or not, call the assigner.
	// Worst case, we could not infer possible types: ok :) 🤷 ¯\_(ツ)_/¯
	// TODO: This will change as the compiler is built out more
	assigner(inferPossibleASTTypesFromASTAssignable(valueAST, symbolTable));

	// either way, we're done
	return ok(undefined);
}

/**
 * Attempts to infer possible ASTTypes from an ASTAssignable.
 * This is very forgiving, and only returns an error in extremely unlikely cases.
 */
export function inferPossibleASTTypesFromASTAssignable(expr: AST, symbolTable: SymbolTable): ASTType[] {
	switch (expr.constructor) {
		case ASTArrayExpression:
			{
				// if the array is empty, we can't infer anything
				if ((expr as ASTArrayExpression<ExpressionASTs>).items.length === 0) {
					return [];
				}

				// map the child type maybe into a Maybe<ASTArrayOf>
				// if we can infer the type of the child, we can infer the type of the array
				return inferPossibleASTTypesFromASTAssignable(
					(expr as ASTArrayExpression<ExpressionASTs>).items[0],
					symbolTable,
				).map((childType) => ASTArrayOf._(childType));
			}
			break;
		case ASTBinaryExpression:
			{
				const operator = (expr as ASTBinaryExpression<ExpressionASTs, ExpressionASTs>).operator;
				switch (operator) {
					case '==':
					case '!=':
					case '>':
					case '>=':
					case '<':
					case '<=':
					case '&&':
					case '||':
						return [ASTTypePrimitiveBool];
						break;
					case '+':
					case '-':
					case '*':
					case '/':
					case '%':
					case '^e':
						{
							const binaryExpr = expr as ASTBinaryExpression<
								ASTNumberLiteral | ASTUnaryExpression<ASTNumberLiteral>,
								ASTNumberLiteral | ASTUnaryExpression<ASTNumberLiteral>
							>;

							// each side could either be an ASTNumberLiteral or an ASTUnaryExpression
							const leftNumberPossibleSizes = getPossibleSizesFromNumberOrUnary(binaryExpr.left);
							const rightNumberPossibleSizes = getPossibleSizesFromNumberOrUnary(binaryExpr.right);

							// for exponent
							if (operator === '^e') {
								// if the right side is a negative exponent, the number size must be a decimal
								if (
									binaryExpr.right.constructor === ASTUnaryExpression &&
									binaryExpr.right.operator === '-'
								) {
									// get the lowest bit count of the left number's possible sizes
									const [firstNumberSize, ...rest] = leftNumberPossibleSizes;
									const lowestBitCount = getLowestBitCountOf(firstNumberSize, ...rest);

									// return decimal number sizes that are at least as big as the left number's lowest bit count
									return filterASTTypeNumbersWithBitCountsLowerThan(
										[...NumberSizesDecimalASTs],
										lowestBitCount,
									);
								}

								// take the left number size
								return leftNumberPossibleSizes.map(ASTTypeNumber._);
							}

							// or if both numbers are the same size, take that size
							if (_.isEqual(leftNumberPossibleSizes, rightNumberPossibleSizes)) {
								return leftNumberPossibleSizes.map(ASTTypeNumber._);
							}

							return _.intersection(leftNumberPossibleSizes, rightNumberPossibleSizes).map(
								ASTTypeNumber._,
							);
						}
						break;
				}
			}
			break;
		case ASTBoolLiteral:
			return [ASTTypePrimitiveBool];
			break;
		case ASTIdentifier:
			{
				const identifier = expr as ASTIdentifier;

				// look up the identifier in the symbol table
				const lookupResult = symbolTable.lookup(identifier.name);
				if (lookupResult.outcome === 'error') {
					// TODO: return an undefined variable error
					return [];
				}

				return lookupResult.value.types;
			}
			break;
		case ASTNumberLiteral:
			return (expr as ASTNumberLiteral).possibleSizes.map((size) => ASTTypeNumber._(size));
			break;
		case ASTObjectExpression:
			{
				const propertiesShapes = (expr as ASTObjectExpression).properties.map((property) =>
					ASTPropertyShape._(
						property.key,
						inferPossibleASTTypesFromASTAssignable(property.value, symbolTable),
					),
				);

				return [ASTObjectShape._(propertiesShapes)];
			}
			break;
		case ASTPath:
			return [ASTTypePrimitivePath];
			break;
		case ASTPostfixIfStatement:
			return inferPossibleASTTypesFromASTAssignable((expr as ASTPostfixIfStatement).expression, symbolTable);
			break;
		case ASTRangeExpression:
			return [ASTTypeRange._()];
			break;
		case ASTRegularExpression:
			return [ASTTypePrimitiveRegex];
			break;
		case ASTStringLiteral:
			return [ASTTypePrimitiveString];
			break;
		case ASTTernaryExpression:
			{
				const ternaryExpr = expr as ASTTernaryExpression<AssignableASTs, AssignableASTs>;
				const typesOfConsequent = inferPossibleASTTypesFromASTAssignable(
					ternaryExpr.consequent.value,
					symbolTable,
				);
				const typesOfAlternate = inferPossibleASTTypesFromASTAssignable(
					ternaryExpr.alternate.value,
					symbolTable,
				);

				return _.intersectionBy(typesOfConsequent, typesOfAlternate, astUniqueness);
			}
			break;
		case ASTTupleExpression:
			{
				const possibleShapes = (expr as ASTTupleExpression).items.map((item) =>
					inferPossibleASTTypesFromASTAssignable(item, symbolTable),
				);

				return [ASTTupleShape._(possibleShapes)];
			}
			break;
		case ASTUnaryExpression:
			{
				const unaryExpression = expr as ASTUnaryExpression<ExpressionASTs>;
				const operator = unaryExpression.operator;
				switch (operator) {
					case '!':
						return [ASTTypePrimitiveBool];
						break;

					case '-':
					case '++':
					case '--':
						// at this point, we can only infer the type of the expression if we know
						// the type of the operand. If we don't, we can't infer anything
						if (unaryExpression.operand.constructor === ASTNumberLiteral) {
							let possibleSizes = unaryExpression.operand.possibleSizes;

							// if using an '-' operator, the possible sizes cannot include unsigned
							if (operator === '-') {
								possibleSizes = _.intersection(possibleSizes, numberSizesSignedInts);
							}

							// otherwise include all possible sizes, and map them to ASTTypeNumbers
							return possibleSizes.map(ASTTypeNumber._);
						}

						// todo check the possible types of other operands
						break;
				}
			}
			break;
		default:
			// console.log('inferPossibleASTTypesFromASTAssignable: unhandled expression type', expr.constructor.name);
			// TODO more work needed here. Discover inferred type of CallExpression, MemberExpression, MemberListExpression, and more
			return [];
	}

	return [];
}

/** function to check if a value may be assigned to a variable/parameter of a given type */
export function isAssignable(value: AssignableASTs, type: ASTType, symbolTable: SymbolTable): boolean {
	const inferredTypes = inferPossibleASTTypesFromASTAssignable(value, symbolTable);

	return inferredTypes.map(astUniqueness).includes(astUniqueness(type));
}
