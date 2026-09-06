/**
 * @file formulaEngine.ts
 * @description Safe mathematical and logical expression parser and evaluator for dynamic blueprint formulas.
 * Block Standard: BLOCK_WORLD_FORMULA_ENGINE_001
 *
 * Supports:
 * - Arithmetic: +, -, *, /, %, ^
 * - Parentheses: ( )
 * - Dot-notation variable resolution: e.g. cultivation.major_realm, attack, special_Physique
 * - Built-in functions: MIN, MAX, CLAMP, FLOOR, CEIL, ROUND, ABS, SQRT, POW, MOD
 * - Logical conditions: IF(cond, trueVal, falseVal), >, <, >=, <=, ==, !=, AND, OR, NOT
 */

export interface FormulaEvaluationResult {
  success: boolean;
  value?: number;
  formattedValue?: string;
  error?: string;
  evaluatedVariables?: Record<string, number>;
}

export interface FormulaValidationResult {
  valid: boolean;
  error?: string;
  extractedVariables: string[];
}

// Token Types for Lexer
type TokenType =
  "NUMBER" | "IDENTIFIER" | "OPERATOR" | "LPAREN" | "RPAREN" | "COMMA" | "EOF";

interface Token {
  type: TokenType;
  value: string;
  pos: number;
}

/**
 * Tokenize a formula string into lexer tokens.
 */
function tokenize(formula: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = formula.length;

  while (i < len) {
    const char = formula[i];

    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Number literals (integers, floats)
    if (
      /[0-9]/.test(char) ||
      (char === "." && i + 1 < len && /[0-9]/.test(formula[i + 1]))
    ) {
      let numStr = "";
      const startPos = i;
      while (i < len && (/[0-9]/.test(formula[i]) || formula[i] === ".")) {
        numStr += formula[i];
        i++;
      }
      tokens.push({ type: "NUMBER", value: numStr, pos: startPos });
      continue;
    }

    // Identifiers (variable names, functions, dot notation e.g. cultivation.major_realm)
    if (/[a-zA-Z_]/.test(char)) {
      let idStr = "";
      const startPos = i;
      while (i < len && /[a-zA-Z0-9_\.]/.test(formula[i])) {
        // Prevent trailing dot inside an identifier if followed by operator
        idStr += formula[i];
        i++;
      }
      tokens.push({ type: "IDENTIFIER", value: idStr, pos: startPos });
      continue;
    }

    // Two-character operators: ==, !=, >=, <=, &&, ||
    if (i + 1 < len) {
      const twoChar = formula.substring(i, i + 2);
      if (["==", "!=", ">=", "<=", "&&", "||"].includes(twoChar)) {
        tokens.push({ type: "OPERATOR", value: twoChar, pos: i });
        i += 2;
        continue;
      }
    }

    // Single-character operators & symbols
    if (["+", "-", "*", "/", "%", "^", ">", "<", "!"].includes(char)) {
      tokens.push({ type: "OPERATOR", value: char, pos: i });
      i++;
      continue;
    }

    if (char === "(") {
      tokens.push({ type: "LPAREN", value: "(", pos: i });
      i++;
      continue;
    }

    if (char === ")") {
      tokens.push({ type: "RPAREN", value: ")", pos: i });
      i++;
      continue;
    }

    if (char === ",") {
      tokens.push({ type: "COMMA", value: ",", pos: i });
      i++;
      continue;
    }

    throw new Error(`Unexpected character '${char}' at position ${i}`);
  }

  tokens.push({ type: "EOF", value: "", pos: len });
  return tokens;
}

/**
 * Extract all variable names referenced in a formula expression.
 */
export function extractFormulaVariables(formula: string): string[] {
  if (!formula || !formula.trim()) return [];
  const knownFunctions = new Set([
    "MIN",
    "MAX",
    "CLAMP",
    "FLOOR",
    "CEIL",
    "ROUND",
    "ABS",
    "SQRT",
    "POW",
    "MOD",
    "IF",
    "AND",
    "OR",
    "NOT",
    "min",
    "max",
    "clamp",
    "floor",
    "ceil",
    "round",
    "abs",
    "sqrt",
    "pow",
    "mod",
    "if",
    "and",
    "or",
    "not",
  ]);

  try {
    const tokens = tokenize(formula);
    const vars = new Set<string>();

    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      if (tok.type === "IDENTIFIER") {
        // If followed by LPAREN, it's a function call
        const nextTok = tokens[i + 1];
        const isFunc = nextTok && nextTok.type === "LPAREN";
        if (!isFunc && !knownFunctions.has(tok.value)) {
          vars.add(tok.value);
        }
      }
    }

    return Array.from(vars);
  } catch {
    // Fallback regex if tokenizer fails on invalid partial input
    const matches = formula.match(/[a-zA-Z_][a-zA-Z0-9_\.]*/g) || [];
    const filtered = matches.filter(
      (m) => !knownFunctions.has(m) && !knownFunctions.has(m.toUpperCase()),
    );
    return Array.from(new Set(filtered));
  }
}

/**
 * Validate formula syntax without evaluating with context.
 */
export function validateFormulaSyntax(
  formula: string,
): FormulaValidationResult {
  if (!formula || !formula.trim()) {
    return {
      valid: false,
      error: "Formula cannot be empty.",
      extractedVariables: [],
    };
  }

  try {
    const vars = extractFormulaVariables(formula);
    // Attempt parse with mock variables (all set to 1)
    const mockContext: Record<string, number> = {};
    for (const v of vars) {
      setDeepProperty(mockContext, v, 1);
    }
    const evalRes = evaluateFormula(formula, mockContext);
    if (!evalRes.success) {
      return { valid: false, error: evalRes.error, extractedVariables: vars };
    }
    return { valid: true, extractedVariables: vars };
  } catch (err: any) {
    return {
      valid: false,
      error: err.message || "Invalid formula syntax.",
      extractedVariables: [],
    };
  }
}

/**
 * Safely resolve a property value from a nested context object.
 * Supports dot notation like 'cultivation.major_realm' or sibling properties 'attack'.
 */
export function resolveContextValue(
  context: Record<string, any>,
  path: string,
): number {
  if (!context) return 0;

  // Direct match on top-level key
  if (path in context) {
    const direct = context[path];
    if (typeof direct === "number") return isNaN(direct) ? 0 : direct;
    if (typeof direct === "string") {
      const parsed = parseFloat(direct);
      return isNaN(parsed) ? 0 : parsed;
    }
    if (typeof direct === "boolean") return direct ? 1 : 0;
    if (direct && typeof direct === "object") {
      if ("numericValue" in direct && typeof direct.numericValue === "number") {
        return direct.numericValue;
      }
      if ("power" in direct && typeof direct.power === "number") {
        return direct.power;
      }
      if ("numeric_value" in direct && typeof direct.numeric_value === "number") {
        return direct.numeric_value;
      }
      if ("value" in direct) {
        return resolveContextValue(direct, "value");
      }
    }
  }

  // Nested dot-notation traversal
  const parts = path.split(".");
  let current: any = context;
  for (const part of parts) {
    if (current === undefined || current === null) return 0;
    current = current[part];
  }

  if (typeof current === "number") return isNaN(current) ? 0 : current;
  if (typeof current === "string") {
    const parsed = parseFloat(current);
    return isNaN(parsed) ? 0 : parsed;
  }
  if (typeof current === "boolean") return current ? 1 : 0;
  if (current && typeof current === "object") {
    if ("numericValue" in current && typeof current.numericValue === "number") {
      return current.numericValue;
    }
    if ("power" in current && typeof current.power === "number") {
      return current.power;
    }
    if ("numeric_value" in current && typeof current.numeric_value === "number") {
      return current.numeric_value;
    }
    if ("value" in current) {
      return resolveContextValue(current, "value");
    }
  }

  // Case-insensitive fallback match
  const lowerPath = path.toLowerCase();
  for (const key of Object.keys(context)) {
    if (key.toLowerCase() === lowerPath) {
      const val = context[key];
      if (typeof val === "number") return isNaN(val) ? 0 : val;
      if (typeof val === "string") {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
      }
      if (val && typeof val === "object") {
        if ("numericValue" in val && typeof val.numericValue === "number") {
          return val.numericValue;
        }
        if ("power" in val && typeof val.power === "number") {
          return val.power;
        }
      }
    }
  }

  return 0;
}

function setDeepProperty(obj: Record<string, any>, path: string, val: any) {
  const parts = path.split(".");
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== "object") {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = val;
}

// ==========================================
// Recursive Descent Parser for Formulas
// ==========================================

class FormulaParser {
  private tokens: Token[];
  private current: number = 0;
  private context: Record<string, any>;
  public evaluatedVariables: Record<string, number> = {};

  constructor(tokens: Token[], context: Record<string, any>) {
    this.tokens = tokens;
    this.context = context;
  }

  private peek(): Token {
    return this.tokens[this.current] || { type: "EOF", value: "", pos: 0 };
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private isAtEnd(): boolean {
    return this.peek().type === "EOF";
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private match(...values: string[]): boolean {
    const tok = this.peek();
    if (values.includes(tok.value)) {
      this.advance();
      return true;
    }
    return false;
  }

  private consume(
    type: TokenType,
    expectedValue?: string,
    message?: string,
  ): Token {
    const tok = this.peek();
    if (tok.type === type && (!expectedValue || tok.value === expectedValue)) {
      return this.advance();
    }
    throw new Error(
      message ||
        `Expected '${expectedValue || type}' at pos ${tok.pos}, found '${tok.value}'`,
    );
  }

  public parse(): number {
    const result = this.expression();
    if (!this.isAtEnd()) {
      throw new Error(
        `Unexpected token '${this.peek().value}' after valid expression.`,
      );
    }
    return result;
  }

  // expression -> logicOr
  private expression(): number {
    return this.logicOr();
  }

  // logicOr -> logicAnd ( "||" logicAnd )*
  private logicOr(): number {
    let expr = this.logicAnd();
    while (this.match("||", "OR")) {
      const right = this.logicAnd();
      expr = expr !== 0 || right !== 0 ? 1 : 0;
    }
    return expr;
  }

  // logicAnd -> equality ( "&&" equality )*
  private logicAnd(): number {
    let expr = this.equality();
    while (this.match("&&", "AND")) {
      const right = this.equality();
      expr = expr !== 0 && right !== 0 ? 1 : 0;
    }
    return expr;
  }

  // equality -> comparison ( ( "!=" | "==" ) comparison )*
  private equality(): number {
    let expr = this.comparison();
    while (this.match("==", "!=")) {
      const op = this.previous().value;
      const right = this.comparison();
      if (op === "==") expr = expr === right ? 1 : 0;
      else if (op === "!=") expr = expr !== right ? 1 : 0;
    }
    return expr;
  }

  // comparison -> addition ( ( ">" | ">=" | "<" | "<=" ) addition )*
  private comparison(): number {
    let expr = this.addition();
    while (this.match(">", ">=", "<", "<=")) {
      const op = this.previous().value;
      const right = this.addition();
      if (op === ">") expr = expr > right ? 1 : 0;
      else if (op === ">=") expr = expr >= right ? 1 : 0;
      else if (op === "<") expr = expr < right ? 1 : 0;
      else if (op === "<=") expr = expr <= right ? 1 : 0;
    }
    return expr;
  }

  // addition -> multiplication ( ( "-" | "+" ) multiplication )*
  private addition(): number {
    let expr = this.multiplication();
    while (this.match("+", "-")) {
      const op = this.previous().value;
      const right = this.multiplication();
      if (op === "+") expr += right;
      else if (op === "-") expr -= right;
    }
    return expr;
  }

  // multiplication -> exponent ( ( "/" | "*" | "%" ) exponent )*
  private multiplication(): number {
    let expr = this.exponent();
    while (this.match("*", "/", "%")) {
      const op = this.previous().value;
      const right = this.exponent();
      if (op === "*") expr *= right;
      else if (op === "/") {
        if (right === 0) throw new Error("Division by zero error in formula.");
        expr /= right;
      } else if (op === "%") {
        if (right === 0) throw new Error("Modulo by zero error in formula.");
        expr %= right;
      }
    }
    return expr;
  }

  // exponent -> unary ( "^" unary )*
  private exponent(): number {
    let expr = this.unary();
    while (this.match("^")) {
      const right = this.unary();
      expr = Math.pow(expr, right);
    }
    return expr;
  }

  // unary -> ( "!" | "-" | "+" ) unary | primary
  private unary(): number {
    if (this.match("!", "NOT")) {
      const right = this.unary();
      return right === 0 ? 1 : 0;
    }
    if (this.match("-")) {
      const right = this.unary();
      return -right;
    }
    if (this.match("+")) {
      return this.unary();
    }
    return this.primary();
  }

  // primary -> NUMBER | IDENTIFIER | FunctionCall | "(" expression ")"
  private primary(): number {
    if (this.peek().type === "NUMBER") {
      const tok = this.advance();
      return parseFloat(tok.value);
    }

    if (this.peek().type === "IDENTIFIER") {
      const idTok = this.advance();
      const idName = idTok.value;

      // Check if it's a function call e.g. IF(...), MIN(...)
      if (this.peek().type === "LPAREN") {
        this.advance(); // consume '('
        const args: number[] = [];
        if (this.peek().type !== "RPAREN") {
          args.push(this.expression());
          while (this.match(",")) {
            args.push(this.expression());
          }
        }
        this.consume(
          "RPAREN",
          ")",
          `Expected ')' after function '${idName}' arguments`,
        );
        return this.executeFunction(idName.toUpperCase(), args);
      }

      // Variable resolution
      const val = resolveContextValue(this.context, idName);
      this.evaluatedVariables[idName] = val;
      return val;
    }

    if (this.match("(")) {
      const expr = this.expression();
      this.consume("RPAREN", ")", "Expected ')' to close parentheses group.");
      return expr;
    }

    throw new Error(
      `Unexpected token '${this.peek().value}' at position ${this.peek().pos}`,
    );
  }

  private executeFunction(funcName: string, args: number[]): number {
    switch (funcName) {
      case "IF":
        if (args.length < 2 || args.length > 3) {
          throw new Error(
            `IF function expects 2 or 3 arguments (condition, trueVal, falseVal?), got ${args.length}`,
          );
        }
        return args[0] !== 0 ? args[1] : args[2] !== undefined ? args[2] : 0;

      case "MIN":
        if (args.length === 0)
          throw new Error("MIN function requires at least 1 argument");
        return Math.min(...args);

      case "MAX":
        if (args.length === 0)
          throw new Error("MAX function requires at least 1 argument");
        return Math.max(...args);

      case "CLAMP":
        if (args.length !== 3)
          throw new Error(
            "CLAMP function requires exactly 3 arguments: CLAMP(val, min, max)",
          );
        return Math.min(Math.max(args[0], args[1]), args[2]);

      case "FLOOR":
        if (args.length !== 1)
          throw new Error("FLOOR function requires 1 argument");
        return Math.floor(args[0]);

      case "CEIL":
        if (args.length !== 1)
          throw new Error("CEIL function requires 1 argument");
        return Math.ceil(args[0]);

      case "ROUND":
        if (args.length !== 1)
          throw new Error("ROUND function requires 1 argument");
        return Math.round(args[0]);

      case "ABS":
        if (args.length !== 1)
          throw new Error("ABS function requires 1 argument");
        return Math.abs(args[0]);

      case "SQRT":
        if (args.length !== 1)
          throw new Error("SQRT function requires 1 argument");
        if (args[0] < 0) throw new Error("SQRT of negative number");
        return Math.sqrt(args[0]);

      case "POW":
        if (args.length !== 2)
          throw new Error("POW function requires 2 arguments: POW(base, exp)");
        return Math.pow(args[0], args[1]);

      case "MOD":
        if (args.length !== 2)
          throw new Error("MOD function requires 2 arguments: MOD(a, b)");
        if (args[1] === 0) throw new Error("Modulo by zero");
        return args[0] % args[1];

      default:
        throw new Error(`Unknown function '${funcName}' in formula.`);
    }
  }
}

/**
 * Evaluates a mathematical / logical formula against an entity's dynamic property context.
 */
export function evaluateFormula(
  formula: string,
  context: Record<string, any> = {},
): FormulaEvaluationResult {
  if (!formula || !formula.trim()) {
    return { success: false, error: "Empty formula expression." };
  }

  try {
    const tokens = tokenize(formula);
    const parser = new FormulaParser(tokens, context);
    const rawVal = parser.parse();

    // Round to 4 decimal places for clean floating point presentation
    const rounded = Math.round((rawVal + Number.EPSILON) * 10000) / 10000;
    const formatted = Number.isInteger(rounded)
      ? rounded.toLocaleString()
      : rounded.toLocaleString(undefined, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 4,
        });

    return {
      success: true,
      value: rounded,
      formattedValue: formatted,
      evaluatedVariables: parser.evaluatedVariables,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Formula evaluation error.",
    };
  }
}
