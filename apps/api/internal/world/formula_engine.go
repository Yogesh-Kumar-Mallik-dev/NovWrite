package world

import (
	"fmt"
	"math"
	"regexp"
	"strconv"
	"strings"
)

// Block Standard: BLOCK_WORLD_FORMULA_ENGINE_002

var (
	identTokenRegex = regexp.MustCompile(`^[a-zA-Z_][a-zA-Z0-9_\.]*$`)
	numTokenRegex   = regexp.MustCompile(`^[0-9]+(\.[0-9]+)?$`)
)

// FormulaValidationResult holds syntax check outcomes.
type FormulaValidationResult struct {
	Valid              bool     `json:"valid"`
	Error              string   `json:"error,omitempty"`
	ExtractedVariables []string `json:"extractedVariables"`
}

// FormulaEvaluationResult holds formula evaluation result.
type FormulaEvaluationResult struct {
	Success            bool               `json:"success"`
	Value              float64            `json:"value"`
	FormattedValue     string             `json:"formattedValue"`
	Error              string             `json:"error,omitempty"`
	EvaluatedVariables map[string]float64 `json:"evaluatedVariables,omitempty"`
}

var knownFunctions = map[string]bool{
	"min": true, "max": true, "clamp": true, "floor": true, "ceil": true,
	"round": true, "abs": true, "sqrt": true, "pow": true, "mod": true,
	"if": true, "and": true, "or": true, "not": true,
}

// Token types
type tokenType int

const (
	tokNumber tokenType = iota
	tokIdent
	tokOp
	tokLParen
	tokRParen
	tokComma
	tokEOF
)

type token struct {
	typ tokenType
	val string
	pos int
}

func tokenizeFormula(expr string) ([]token, error) {
	var tokens []token
	runes := []rune(expr)
	n := len(runes)
	i := 0

	for i < n {
		c := runes[i]

		// Skip whitespace
		if c == ' ' || c == '\t' || c == '\n' || c == '\r' {
			i++
			continue
		}

		// Numbers
		if (c >= '0' && c <= '9') || (c == '.' && i+1 < n && runes[i+1] >= '0' && runes[i+1] <= '9') {
			start := i
			var sb strings.Builder
			for i < n && ((runes[i] >= '0' && runes[i] <= '9') || runes[i] == '.') {
				sb.WriteRune(runes[i])
				i++
			}
			tokens = append(tokens, token{typ: tokNumber, val: sb.String(), pos: start})
			continue
		}

		// Identifiers (variables, functions, dot notation)
		if (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_' {
			start := i
			var sb strings.Builder
			for i < n && ((runes[i] >= 'a' && runes[i] <= 'z') || (runes[i] >= 'A' && runes[i] <= 'Z') || (runes[i] >= '0' && runes[i] <= '9') || runes[i] == '_' || runes[i] == '.') {
				sb.WriteRune(runes[i])
				i++
			}
			tokens = append(tokens, token{typ: tokIdent, val: sb.String(), pos: start})
			continue
		}

		// Multi-character operators
		if i+1 < n {
			two := string(runes[i : i+2])
			if two == "==" || two == "!=" || two == ">=" || two == "<=" || two == "&&" || two == "||" {
				tokens = append(tokens, token{typ: tokOp, val: two, pos: i})
				i += 2
				continue
			}
		}

		// Single-character operators
		if strings.ContainsRune("+-*/%^><!", c) {
			tokens = append(tokens, token{typ: tokOp, val: string(c), pos: i})
			i++
			continue
		}

		if c == '(' {
			tokens = append(tokens, token{typ: tokLParen, val: "(", pos: i})
			i++
			continue
		}

		if c == ')' {
			tokens = append(tokens, token{typ: tokRParen, val: ")", pos: i})
			i++
			continue
		}

		if c == ',' {
			tokens = append(tokens, token{typ: tokComma, val: ",", pos: i})
			i++
			continue
		}

		return nil, fmt.Errorf("unexpected character '%c' at position %d", c, i)
	}

	tokens = append(tokens, token{typ: tokEOF, val: "", pos: n})
	return tokens, nil
}

// ExtractFormulaVariables extracts all dynamic property variables referenced in an expression.
func ExtractFormulaVariables(expr string) []string {
	tokens, err := tokenizeFormula(expr)
	if err != nil {
		return nil
	}

	varMap := make(map[string]bool)
	var list []string

	for i := 0; i < len(tokens); i++ {
		tok := tokens[i]
		if tok.typ == tokIdent {
			lower := strings.ToLower(tok.val)
			isFunc := false
			if i+1 < len(tokens) && tokens[i+1].typ == tokLParen {
				isFunc = true
			}
			if !isFunc && !knownFunctions[lower] {
				key := strings.ToLower(tok.val)
				if !varMap[key] {
					varMap[key] = true
					list = append(list, key)
				}
			}
		}
	}

	return list
}

// ValidateFormulaSyntax checks if formula syntax is valid and extracts variable dependencies.
func ValidateFormulaSyntax(expr string) FormulaValidationResult {
	if strings.TrimSpace(expr) == "" {
		return FormulaValidationResult{
			Valid:              false,
			Error:              "Formula expression cannot be empty",
			ExtractedVariables: nil,
		}
	}

	tokens, err := tokenizeFormula(expr)
	if err != nil {
		return FormulaValidationResult{
			Valid:              false,
			Error:              err.Error(),
			ExtractedVariables: nil,
		}
	}

	extracted := ExtractFormulaVariables(expr)

	// Create dummy context with 1.0 for all extracted variables to test parse & evaluation
	dummyCtx := make(map[string]interface{})
	for _, v := range extracted {
		dummyCtx[v] = 1.0
	}

	p := &formulaParser{tokens: tokens, pos: 0, context: dummyCtx}
	_, evalErr := p.parseExpression()
	if evalErr != nil {
		return FormulaValidationResult{
			Valid:              false,
			Error:              evalErr.Error(),
			ExtractedVariables: extracted,
		}
	}

	if p.currentToken().typ != tokEOF {
		return FormulaValidationResult{
			Valid:              false,
			Error:              fmt.Sprintf("Unexpected token '%s' at position %d", p.currentToken().val, p.currentToken().pos),
			ExtractedVariables: extracted,
		}
	}

	return FormulaValidationResult{
		Valid:              true,
		ExtractedVariables: extracted,
	}
}

// EvaluateFormula executes a mathematical and logical expression against an entity property context.
func EvaluateFormula(expr string, context map[string]interface{}) (float64, error) {
	if strings.TrimSpace(expr) == "" {
		return 0, fmt.Errorf("empty formula expression")
	}

	tokens, err := tokenizeFormula(expr)
	if err != nil {
		return 0, err
	}

	// Normalize context keys to lowercase
	normalizedCtx := make(map[string]interface{})
	for k, v := range context {
		normalizedCtx[strings.ToLower(k)] = v
		// Also support dot-flattened keys if passed as nested maps
		if nestedMap, ok := v.(map[string]interface{}); ok {
			for subK, subV := range nestedMap {
				normalizedCtx[fmt.Sprintf("%s.%s", strings.ToLower(k), strings.ToLower(subK))] = subV
			}
		}
	}

	p := &formulaParser{tokens: tokens, pos: 0, context: normalizedCtx}
	val, err := p.parseExpression()
	if err != nil {
		return 0, err
	}

	if p.currentToken().typ != tokEOF {
		return 0, fmt.Errorf("unexpected token '%s' after complete expression", p.currentToken().val)
	}

	if math.IsNaN(val) || math.IsInf(val, 0) {
		return 0, fmt.Errorf("formula resulted in non-finite value (NaN or Infinity)")
	}

	return val, nil
}

type formulaParser struct {
	tokens  []token
	pos     int
	context map[string]interface{}
}

func (p *formulaParser) currentToken() token {
	if p.pos < len(p.tokens) {
		return p.tokens[p.pos]
	}
	return token{typ: tokEOF, val: ""}
}

func (p *formulaParser) consume() token {
	tok := p.currentToken()
	p.pos++
	return tok
}

func (p *formulaParser) parseExpression() (float64, error) {
	return p.parseLogicalOr()
}

func (p *formulaParser) parseLogicalOr() (float64, error) {
	left, err := p.parseLogicalAnd()
	if err != nil {
		return 0, err
	}

	for p.currentToken().typ == tokOp && (p.currentToken().val == "||" || strings.EqualFold(p.currentToken().val, "or")) {
		p.consume()
		right, err := p.parseLogicalAnd()
		if err != nil {
			return 0, err
		}
		if left != 0 || right != 0 {
			left = 1.0
		} else {
			left = 0.0
		}
	}

	return left, nil
}

func (p *formulaParser) parseLogicalAnd() (float64, error) {
	left, err := p.parseComparison()
	if err != nil {
		return 0, err
	}

	for p.currentToken().typ == tokOp && (p.currentToken().val == "&&" || strings.EqualFold(p.currentToken().val, "and")) {
		p.consume()
		right, err := p.parseComparison()
		if err != nil {
			return 0, err
		}
		if left != 0 && right != 0 {
			left = 1.0
		} else {
			left = 0.0
		}
	}

	return left, nil
}

func (p *formulaParser) parseComparison() (float64, error) {
	left, err := p.parseAddSub()
	if err != nil {
		return 0, err
	}

	for p.currentToken().typ == tokOp && (p.currentToken().val == "==" || p.currentToken().val == "!=" ||
		p.currentToken().val == ">=" || p.currentToken().val == "<=" ||
		p.currentToken().val == ">" || p.currentToken().val == "<") {
		op := p.consume().val
		right, err := p.parseAddSub()
		if err != nil {
			return 0, err
		}

		switch op {
		case "==":
			if math.Abs(left-right) < 1e-9 {
				left = 1.0
			} else {
				left = 0.0
			}
		case "!=":
			if math.Abs(left-right) >= 1e-9 {
				left = 1.0
			} else {
				left = 0.0
			}
		case ">":
			if left > right {
				left = 1.0
			} else {
				left = 0.0
			}
		case "<":
			if left < right {
				left = 1.0
			} else {
				left = 0.0
			}
		case ">=":
			if left >= right {
				left = 1.0
			} else {
				left = 0.0
			}
		case "<=":
			if left <= right {
				left = 1.0
			} else {
				left = 0.0
			}
		}
	}

	return left, nil
}

func (p *formulaParser) parseAddSub() (float64, error) {
	left, err := p.parseMulDiv()
	if err != nil {
		return 0, err
	}

	for p.currentToken().typ == tokOp && (p.currentToken().val == "+" || p.currentToken().val == "-") {
		op := p.consume().val
		right, err := p.parseMulDiv()
		if err != nil {
			return 0, err
		}

		if op == "+" {
			left += right
		} else {
			left -= right
		}
	}

	return left, nil
}

func (p *formulaParser) parseMulDiv() (float64, error) {
	left, err := p.parseExponent()
	if err != nil {
		return 0, err
	}

	for p.currentToken().typ == tokOp && (p.currentToken().val == "*" || p.currentToken().val == "/" || p.currentToken().val == "%") {
		op := p.consume().val
		right, err := p.parseExponent()
		if err != nil {
			return 0, err
		}

		switch op {
		case "*":
			left *= right
		case "/":
			if math.Abs(right) < 1e-9 {
				return 0, fmt.Errorf("division by zero in formula")
			}
			left /= right
		case "%":
			if math.Abs(right) < 1e-9 {
				return 0, fmt.Errorf("modulo by zero in formula")
			}
			left = math.Mod(left, right)
		}
	}

	return left, nil
}

func (p *formulaParser) parseExponent() (float64, error) {
	left, err := p.parseUnary()
	if err != nil {
		return 0, err
	}

	if p.currentToken().typ == tokOp && p.currentToken().val == "^" {
		p.consume()
		right, err := p.parseExponent()
		if err != nil {
			return 0, err
		}
		left = math.Pow(left, right)
	}

	return left, nil
}

func (p *formulaParser) parseUnary() (float64, error) {
	if p.currentToken().typ == tokOp && (p.currentToken().val == "-" || p.currentToken().val == "+" || p.currentToken().val == "!") {
		op := p.consume().val
		val, err := p.parseUnary()
		if err != nil {
			return 0, err
		}
		if op == "-" {
			return -val, nil
		}
		if op == "!" {
			if val == 0 {
				return 1.0, nil
			}
			return 0.0, nil
		}
		return val, nil
	}

	return p.parsePrimary()
}

func (p *formulaParser) parsePrimary() (float64, error) {
	tok := p.currentToken()

	switch tok.typ {
	case tokNumber:
		p.consume()
		num, err := strconv.ParseFloat(tok.val, 64)
		if err != nil {
			return 0, fmt.Errorf("invalid number format '%s'", tok.val)
		}
		return num, nil

	case tokIdent:
		name := p.consume().val
		lower := strings.ToLower(name)

		// Check if function call
		if p.currentToken().typ == tokLParen {
			p.consume() // '('
			var args []float64
			if p.currentToken().typ != tokRParen {
				for {
					arg, err := p.parseExpression()
					if err != nil {
						return 0, err
					}
					args = append(args, arg)
					if p.currentToken().typ == tokComma {
						p.consume()
						continue
					}
					break
				}
			}
			if p.currentToken().typ != tokRParen {
				return 0, fmt.Errorf("missing closing parenthesis for function '%s'", name)
			}
			p.consume() // ')'

			return executeBuiltinFunction(lower, args)
		}

		// Variable lookup
		if val, ok := p.context[lower]; ok {
			switch v := val.(type) {
			case float64:
				return v, nil
			case int:
				return float64(v), nil
			case int64:
				return float64(v), nil
			case bool:
				if v {
					return 1.0, nil
				}
				return 0.0, nil
			case string:
				if num, err := strconv.ParseFloat(v, 64); err == nil {
					return num, nil
				}
			case map[string]interface{}:
				if powerVal, hasPower := v["power"]; hasPower {
					if pNum, err := strconv.ParseFloat(fmt.Sprintf("%v", powerVal), 64); err == nil {
						return pNum, nil
					}
				}
			}
		}

		// Fallback 0.0 for undefined variables
		return 0.0, nil

	case tokLParen:
		p.consume()
		val, err := p.parseExpression()
		if err != nil {
			return 0, err
		}
		if p.currentToken().typ != tokRParen {
			return 0, fmt.Errorf("missing closing parenthesis")
		}
		p.consume()
		return val, nil

	default:
		return 0, fmt.Errorf("unexpected token '%s' at position %d", tok.val, tok.pos)
	}
}

func executeBuiltinFunction(funcName string, args []float64) (float64, error) {
	switch funcName {
	case "min":
		if len(args) == 0 {
			return 0, fmt.Errorf("min requires at least 1 argument")
		}
		m := args[0]
		for _, a := range args[1:] {
			if a < m {
				m = a
			}
		}
		return m, nil

	case "max":
		if len(args) == 0 {
			return 0, fmt.Errorf("max requires at least 1 argument")
		}
		m := args[0]
		for _, a := range args[1:] {
			if a > m {
				m = a
			}
		}
		return m, nil

	case "clamp":
		if len(args) != 3 {
			return 0, fmt.Errorf("clamp requires 3 arguments (val, min, max)")
		}
		val, minVal, maxVal := args[0], args[1], args[2]
		if val < minVal {
			return minVal, nil
		}
		if val > maxVal {
			return maxVal, nil
		}
		return val, nil

	case "floor":
		if len(args) != 1 {
			return 0, fmt.Errorf("floor requires 1 argument")
		}
		return math.Floor(args[0]), nil

	case "ceil":
		if len(args) != 1 {
			return 0, fmt.Errorf("ceil requires 1 argument")
		}
		return math.Ceil(args[0]), nil

	case "round":
		if len(args) != 1 {
			return 0, fmt.Errorf("round requires 1 argument")
		}
		return math.Round(args[0]), nil

	case "abs":
		if len(args) != 1 {
			return 0, fmt.Errorf("abs requires 1 argument")
		}
		return math.Abs(args[0]), nil

	case "sqrt":
		if len(args) != 1 {
			return 0, fmt.Errorf("sqrt requires 1 argument")
		}
		if args[0] < 0 {
			return 0, fmt.Errorf("cannot calculate square root of negative number (%v)", args[0])
		}
		return math.Sqrt(args[0]), nil

	case "pow":
		if len(args) != 2 {
			return 0, fmt.Errorf("pow requires 2 arguments (base, exp)")
		}
		return math.Pow(args[0], args[1]), nil

	case "mod":
		if len(args) != 2 {
			return 0, fmt.Errorf("mod requires 2 arguments (val, div)")
		}
		if math.Abs(args[1]) < 1e-9 {
			return 0, fmt.Errorf("modulo by zero")
		}
		return math.Mod(args[0], args[1]), nil

	case "if":
		if len(args) != 3 {
			return 0, fmt.Errorf("if requires 3 arguments (condition, trueValue, falseValue)")
		}
		if args[0] != 0 {
			return args[1], nil
		}
		return args[2], nil

	default:
		return 0, fmt.Errorf("unknown formula function '%s'", funcName)
	}
}
