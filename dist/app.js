var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target2) => (target2 = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target2, "default", { value: mod, enumerable: true }) : target2,
  mod
));

// node_modules/luaparse/luaparse.js
var require_luaparse = __commonJS({
  "node_modules/luaparse/luaparse.js"(exports, module) {
    (function(root, name2, factory) {
      "use strict";
      var objectTypes = {
        "function": true,
        "object": true
      }, freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports, freeModule = objectTypes[typeof module] && module && !module.nodeType && module, freeGlobal = freeExports && freeModule && typeof global === "object" && global, moduleExports = freeModule && freeModule.exports === freeExports && freeExports;
      if (freeGlobal && (freeGlobal.global === freeGlobal || /* istanbul ignore next */
      freeGlobal.window === freeGlobal || /* istanbul ignore next */
      freeGlobal.self === freeGlobal)) {
        root = freeGlobal;
      }
      if (typeof define === "function" && /* istanbul ignore next */
      typeof define.amd === "object" && /* istanbul ignore next */
      define.amd) {
        define(["exports"], factory);
        if (freeExports && moduleExports) factory(freeModule.exports);
      } else if (freeExports && freeModule) {
        if (moduleExports) factory(freeModule.exports);
        else factory(freeExports);
      } else {
        factory(root[name2] = {});
      }
    })(exports, "luaparse", function(exports2) {
      "use strict";
      exports2.version = "0.3.1";
      var input, options, length, features, encodingMode;
      var defaultOptions2 = exports2.defaultOptions = {
        // Explicitly tell the parser when the input ends.
        wait: false,
        comments: true,
        scope: false,
        locations: false,
        ranges: false,
        onCreateNode: null,
        onCreateScope: null,
        onDestroyScope: null,
        onLocalDeclaration: null,
        luaVersion: "5.1",
        encodingMode: "none"
      };
      function encodeUTF8(codepoint, highMask) {
        highMask = highMask || 0;
        if (codepoint < 128) {
          return String.fromCharCode(codepoint);
        } else if (codepoint < 2048) {
          return String.fromCharCode(
            highMask | 192 | codepoint >> 6,
            highMask | 128 | codepoint & 63
          );
        } else if (codepoint < 65536) {
          return String.fromCharCode(
            highMask | 224 | codepoint >> 12,
            highMask | 128 | codepoint >> 6 & 63,
            highMask | 128 | codepoint & 63
          );
        } else if (codepoint < 1114112) {
          return String.fromCharCode(
            highMask | 240 | codepoint >> 18,
            highMask | 128 | codepoint >> 12 & 63,
            highMask | 128 | codepoint >> 6 & 63,
            highMask | 128 | codepoint & 63
          );
        } else {
          return null;
        }
      }
      function toHex(num, digits) {
        var result = num.toString(16);
        while (result.length < digits)
          result = "0" + result;
        return result;
      }
      function checkChars(rx) {
        return function(s) {
          var m = rx.exec(s);
          if (!m)
            return s;
          raise(null, errors.invalidCodeUnit, toHex(m[0].charCodeAt(0), 4).toUpperCase());
        };
      }
      var encodingModes = {
        // `pseudo-latin1` encoding mode: assume the input was decoded with the latin1 encoding
        // WARNING: latin1 does **NOT** mean cp1252 here like in the bone-headed WHATWG standard;
        // it means true ISO/IEC 8859-1 identity-mapped to Basic Latin and Latin-1 Supplement blocks
        "pseudo-latin1": {
          fixup: checkChars(/[^\x00-\xff]/),
          encodeByte: function(value) {
            if (value === null)
              return "";
            return String.fromCharCode(value);
          },
          encodeUTF8: function(codepoint) {
            return encodeUTF8(codepoint);
          }
        },
        // `x-user-defined` encoding mode: assume the input was decoded with the WHATWG `x-user-defined` encoding
        "x-user-defined": {
          fixup: checkChars(/[^\x00-\x7f\uf780-\uf7ff]/),
          encodeByte: function(value) {
            if (value === null)
              return "";
            if (value >= 128)
              return String.fromCharCode(value | 63232);
            return String.fromCharCode(value);
          },
          encodeUTF8: function(codepoint) {
            return encodeUTF8(codepoint, 63232);
          }
        },
        // `none` encoding mode: disregard intrepretation of string literals, leave identifiers as-is
        "none": {
          discardStrings: true,
          fixup: function(s) {
            return s;
          },
          encodeByte: function(value) {
            return "";
          },
          encodeUTF8: function(codepoint) {
            return "";
          }
        }
      };
      var EOF = 1, StringLiteral = 2, Keyword = 4, Identifier = 8, NumericLiteral = 16, Punctuator = 32, BooleanLiteral = 64, NilLiteral = 128, VarargLiteral = 256;
      exports2.tokenTypes = {
        EOF,
        StringLiteral,
        Keyword,
        Identifier,
        NumericLiteral,
        Punctuator,
        BooleanLiteral,
        NilLiteral,
        VarargLiteral
      };
      var errors = exports2.errors = {
        unexpected: "unexpected %1 '%2' near '%3'",
        unexpectedEOF: "unexpected symbol near '<eof>'",
        expected: "'%1' expected near '%2'",
        expectedToken: "%1 expected near '%2'",
        unfinishedString: "unfinished string near '%1'",
        malformedNumber: "malformed number near '%1'",
        decimalEscapeTooLarge: "decimal escape too large near '%1'",
        invalidEscape: "invalid escape sequence near '%1'",
        hexadecimalDigitExpected: "hexadecimal digit expected near '%1'",
        braceExpected: "missing '%1' near '%2'",
        tooLargeCodepoint: "UTF-8 value too large near '%1'",
        unfinishedLongString: "unfinished long string (starting at line %1) near '%2'",
        unfinishedLongComment: "unfinished long comment (starting at line %1) near '%2'",
        ambiguousSyntax: "ambiguous syntax (function call x new statement) near '%1'",
        noLoopToBreak: "no loop to break near '%1'",
        labelAlreadyDefined: "label '%1' already defined on line %2",
        labelNotVisible: "no visible label '%1' for <goto>",
        gotoJumpInLocalScope: "<goto %1> jumps into the scope of local '%2'",
        cannotUseVararg: "cannot use '...' outside a vararg function near '%1'",
        invalidCodeUnit: "code unit U+%1 is not allowed in the current encoding mode"
      };
      var ast = exports2.ast = {
        labelStatement: function(label) {
          return {
            type: "LabelStatement",
            label
          };
        },
        breakStatement: function() {
          return {
            type: "BreakStatement"
          };
        },
        gotoStatement: function(label) {
          return {
            type: "GotoStatement",
            label
          };
        },
        returnStatement: function(args) {
          return {
            type: "ReturnStatement",
            "arguments": args
          };
        },
        ifStatement: function(clauses) {
          return {
            type: "IfStatement",
            clauses
          };
        },
        ifClause: function(condition, body) {
          return {
            type: "IfClause",
            condition,
            body
          };
        },
        elseifClause: function(condition, body) {
          return {
            type: "ElseifClause",
            condition,
            body
          };
        },
        elseClause: function(body) {
          return {
            type: "ElseClause",
            body
          };
        },
        whileStatement: function(condition, body) {
          return {
            type: "WhileStatement",
            condition,
            body
          };
        },
        doStatement: function(body) {
          return {
            type: "DoStatement",
            body
          };
        },
        repeatStatement: function(condition, body) {
          return {
            type: "RepeatStatement",
            condition,
            body
          };
        },
        localStatement: function(variables, init) {
          return {
            type: "LocalStatement",
            variables,
            init
          };
        },
        assignmentStatement: function(variables, init) {
          return {
            type: "AssignmentStatement",
            variables,
            init
          };
        },
        callStatement: function(expression) {
          return {
            type: "CallStatement",
            expression
          };
        },
        functionStatement: function(identifier, parameters, isLocal, body) {
          return {
            type: "FunctionDeclaration",
            identifier,
            isLocal,
            parameters,
            body
          };
        },
        forNumericStatement: function(variable, start, end2, step, body) {
          return {
            type: "ForNumericStatement",
            variable,
            start,
            end: end2,
            step,
            body
          };
        },
        forGenericStatement: function(variables, iterators, body) {
          return {
            type: "ForGenericStatement",
            variables,
            iterators,
            body
          };
        },
        chunk: function(body) {
          return {
            type: "Chunk",
            body
          };
        },
        identifier: function(name2) {
          return {
            type: "Identifier",
            name: name2
          };
        },
        literal: function(type, value, raw) {
          type = type === StringLiteral ? "StringLiteral" : type === NumericLiteral ? "NumericLiteral" : type === BooleanLiteral ? "BooleanLiteral" : type === NilLiteral ? "NilLiteral" : "VarargLiteral";
          return {
            type,
            value,
            raw
          };
        },
        tableKey: function(key, value) {
          return {
            type: "TableKey",
            key,
            value
          };
        },
        tableKeyString: function(key, value) {
          return {
            type: "TableKeyString",
            key,
            value
          };
        },
        tableValue: function(value) {
          return {
            type: "TableValue",
            value
          };
        },
        tableConstructorExpression: function(fields) {
          return {
            type: "TableConstructorExpression",
            fields
          };
        },
        binaryExpression: function(operator, left, right) {
          var type = "and" === operator || "or" === operator ? "LogicalExpression" : "BinaryExpression";
          return {
            type,
            operator,
            left,
            right
          };
        },
        unaryExpression: function(operator, argument) {
          return {
            type: "UnaryExpression",
            operator,
            argument
          };
        },
        memberExpression: function(base, indexer, identifier) {
          return {
            type: "MemberExpression",
            indexer,
            identifier,
            base
          };
        },
        indexExpression: function(base, index2) {
          return {
            type: "IndexExpression",
            base,
            index: index2
          };
        },
        callExpression: function(base, args) {
          return {
            type: "CallExpression",
            base,
            "arguments": args
          };
        },
        tableCallExpression: function(base, args) {
          return {
            type: "TableCallExpression",
            base,
            "arguments": args
          };
        },
        stringCallExpression: function(base, argument) {
          return {
            type: "StringCallExpression",
            base,
            argument
          };
        },
        comment: function(value, raw) {
          return {
            type: "Comment",
            value,
            raw
          };
        }
      };
      function finishNode(node) {
        if (trackLocations) {
          var location = locations.pop();
          location.complete();
          location.bless(node);
        }
        if (options.onCreateNode) options.onCreateNode(node);
        return node;
      }
      var slice = Array.prototype.slice, toString = Object.prototype.toString;
      var indexOf = (
        /* istanbul ignore next */
        function(array, element) {
          for (var i = 0, length2 = array.length; i < length2; ++i) {
            if (array[i] === element) return i;
          }
          return -1;
        }
      );
      if (Array.prototype.indexOf)
        indexOf = function(array, element) {
          return array.indexOf(element);
        };
      function indexOfObject(array, property, element) {
        for (var i = 0, length2 = array.length; i < length2; ++i) {
          if (array[i][property] === element) return i;
        }
        return -1;
      }
      function sprintf(format) {
        var args = slice.call(arguments, 1);
        format = format.replace(/%(\d)/g, function(match, index2) {
          return "" + args[index2 - 1] || /* istanbul ignore next */
          "";
        });
        return format;
      }
      var assign = (
        /* istanbul ignore next */
        function(dest) {
          var args = slice.call(arguments, 1), src2, prop;
          for (var i = 0, length2 = args.length; i < length2; ++i) {
            src2 = args[i];
            for (prop in src2)
              if (Object.prototype.hasOwnProperty.call(src2, prop)) {
                dest[prop] = src2[prop];
              }
          }
          return dest;
        }
      );
      if (Object.assign)
        assign = Object.assign;
      exports2.SyntaxError = SyntaxError;
      function fixupError(e) {
        if (!Object.create)
          return e;
        return Object.create(e, {
          "line": { "writable": true, value: e.line },
          "index": { "writable": true, value: e.index },
          "column": { "writable": true, value: e.column }
        });
      }
      function raise(token2) {
        var message = sprintf.apply(null, slice.call(arguments, 1)), error, col;
        if (token2 === null || typeof token2.line === "undefined") {
          col = index - lineStart + 1;
          error = fixupError(new SyntaxError(sprintf("[%1:%2] %3", line, col, message)));
          error.index = index;
          error.line = line;
          error.column = col;
        } else {
          col = token2.range[0] - token2.lineStart;
          error = fixupError(new SyntaxError(sprintf("[%1:%2] %3", token2.line, col, message)));
          error.line = token2.line;
          error.index = token2.range[0];
          error.column = col;
        }
        throw error;
      }
      function tokenValue(token2) {
        var raw = input.slice(token2.range[0], token2.range[1]);
        if (raw)
          return raw;
        return token2.value;
      }
      function raiseUnexpectedToken(type, token2) {
        raise(token2, errors.expectedToken, type, tokenValue(token2));
      }
      function unexpected(found) {
        var near = tokenValue(lookahead);
        if ("undefined" !== typeof found.type) {
          var type;
          switch (found.type) {
            case StringLiteral:
              type = "string";
              break;
            case Keyword:
              type = "keyword";
              break;
            case Identifier:
              type = "identifier";
              break;
            case NumericLiteral:
              type = "number";
              break;
            case Punctuator:
              type = "symbol";
              break;
            case BooleanLiteral:
              type = "boolean";
              break;
            case NilLiteral:
              return raise(found, errors.unexpected, "symbol", "nil", near);
            case EOF:
              return raise(found, errors.unexpectedEOF);
          }
          return raise(found, errors.unexpected, type, tokenValue(found), near);
        }
        return raise(found, errors.unexpected, "symbol", found, near);
      }
      var index, token, previousToken, lookahead, comments, tokenStart, line, lineStart;
      exports2.lex = lex;
      function lex() {
        skipWhiteSpace();
        while (45 === input.charCodeAt(index) && 45 === input.charCodeAt(index + 1)) {
          scanComment();
          skipWhiteSpace();
        }
        if (index >= length) return {
          type: EOF,
          value: "<eof>",
          line,
          lineStart,
          range: [index, index]
        };
        var charCode = input.charCodeAt(index), next2 = input.charCodeAt(index + 1);
        tokenStart = index;
        if (isIdentifierStart(charCode)) return scanIdentifierOrKeyword();
        switch (charCode) {
          case 39:
          case 34:
            return scanStringLiteral();
          case 48:
          case 49:
          case 50:
          case 51:
          case 52:
          case 53:
          case 54:
          case 55:
          case 56:
          case 57:
            return scanNumericLiteral();
          case 46:
            if (isDecDigit(next2)) return scanNumericLiteral();
            if (46 === next2) {
              if (46 === input.charCodeAt(index + 2)) return scanVarargLiteral();
              return scanPunctuator("..");
            }
            return scanPunctuator(".");
          case 61:
            if (61 === next2) return scanPunctuator("==");
            return scanPunctuator("=");
          case 62:
            if (features.bitwiseOperators) {
              if (62 === next2) return scanPunctuator(">>");
            }
            if (61 === next2) return scanPunctuator(">=");
            return scanPunctuator(">");
          case 60:
            if (features.bitwiseOperators) {
              if (60 === next2) return scanPunctuator("<<");
            }
            if (61 === next2) return scanPunctuator("<=");
            return scanPunctuator("<");
          case 126:
            if (61 === next2) return scanPunctuator("~=");
            if (!features.bitwiseOperators)
              break;
            return scanPunctuator("~");
          case 58:
            if (features.labels) {
              if (58 === next2) return scanPunctuator("::");
            }
            return scanPunctuator(":");
          case 91:
            if (91 === next2 || 61 === next2) return scanLongStringLiteral();
            return scanPunctuator("[");
          case 47:
            if (features.integerDivision) {
              if (47 === next2) return scanPunctuator("//");
            }
            return scanPunctuator("/");
          case 38:
          case 124:
            if (!features.bitwiseOperators)
              break;
          /* fall through */
          case 42:
          case 94:
          case 37:
          case 44:
          case 123:
          case 125:
          case 93:
          case 40:
          case 41:
          case 59:
          case 35:
          case 45:
          case 43:
            return scanPunctuator(input.charAt(index));
        }
        return unexpected(input.charAt(index));
      }
      function consumeEOL() {
        var charCode = input.charCodeAt(index), peekCharCode = input.charCodeAt(index + 1);
        if (isLineTerminator(charCode)) {
          if (10 === charCode && 13 === peekCharCode) ++index;
          if (13 === charCode && 10 === peekCharCode) ++index;
          ++line;
          lineStart = ++index;
          return true;
        }
        return false;
      }
      function skipWhiteSpace() {
        while (index < length) {
          var charCode = input.charCodeAt(index);
          if (isWhiteSpace(charCode)) {
            ++index;
          } else if (!consumeEOL()) {
            break;
          }
        }
      }
      function scanIdentifierOrKeyword() {
        var value, type;
        while (isIdentifierPart(input.charCodeAt(++index))) ;
        value = encodingMode.fixup(input.slice(tokenStart, index));
        if (isKeyword(value)) {
          type = Keyword;
        } else if ("true" === value || "false" === value) {
          type = BooleanLiteral;
          value = "true" === value;
        } else if ("nil" === value) {
          type = NilLiteral;
          value = null;
        } else {
          type = Identifier;
        }
        return {
          type,
          value,
          line,
          lineStart,
          range: [tokenStart, index]
        };
      }
      function scanPunctuator(value) {
        index += value.length;
        return {
          type: Punctuator,
          value,
          line,
          lineStart,
          range: [tokenStart, index]
        };
      }
      function scanVarargLiteral() {
        index += 3;
        return {
          type: VarargLiteral,
          value: "...",
          line,
          lineStart,
          range: [tokenStart, index]
        };
      }
      function scanStringLiteral() {
        var delimiter = input.charCodeAt(index++), beginLine = line, beginLineStart = lineStart, stringStart = index, string = encodingMode.discardStrings ? null : "", charCode;
        for (; ; ) {
          charCode = input.charCodeAt(index++);
          if (delimiter === charCode) break;
          if (index > length || isLineTerminator(charCode)) {
            string += input.slice(stringStart, index - 1);
            raise(null, errors.unfinishedString, input.slice(tokenStart, index - 1));
          }
          if (92 === charCode) {
            if (!encodingMode.discardStrings) {
              var beforeEscape = input.slice(stringStart, index - 1);
              string += encodingMode.fixup(beforeEscape);
            }
            var escapeValue = readEscapeSequence();
            if (!encodingMode.discardStrings)
              string += escapeValue;
            stringStart = index;
          }
        }
        if (!encodingMode.discardStrings) {
          string += encodingMode.encodeByte(null);
          string += encodingMode.fixup(input.slice(stringStart, index - 1));
        }
        return {
          type: StringLiteral,
          value: string,
          line: beginLine,
          lineStart: beginLineStart,
          lastLine: line,
          lastLineStart: lineStart,
          range: [tokenStart, index]
        };
      }
      function scanLongStringLiteral() {
        var beginLine = line, beginLineStart = lineStart, string = readLongString(false);
        if (false === string) raise(token, errors.expected, "[", tokenValue(token));
        return {
          type: StringLiteral,
          value: encodingMode.discardStrings ? null : encodingMode.fixup(string),
          line: beginLine,
          lineStart: beginLineStart,
          lastLine: line,
          lastLineStart: lineStart,
          range: [tokenStart, index]
        };
      }
      function scanNumericLiteral() {
        var character = input.charAt(index), next2 = input.charAt(index + 1);
        var literal = "0" === character && "xX".indexOf(next2 || null) >= 0 ? readHexLiteral() : readDecLiteral();
        var foundImaginaryUnit = readImaginaryUnitSuffix(), foundInt64Suffix = readInt64Suffix();
        if (foundInt64Suffix && (foundImaginaryUnit || literal.hasFractionPart)) {
          raise(null, errors.malformedNumber, input.slice(tokenStart, index));
        }
        return {
          type: NumericLiteral,
          value: literal.value,
          line,
          lineStart,
          range: [tokenStart, index]
        };
      }
      function readImaginaryUnitSuffix() {
        if (!features.imaginaryNumbers) return;
        if ("iI".indexOf(input.charAt(index) || null) >= 0) {
          ++index;
          return true;
        } else {
          return false;
        }
      }
      function readInt64Suffix() {
        if (!features.integerSuffixes) return;
        if ("uU".indexOf(input.charAt(index) || null) >= 0) {
          ++index;
          if ("lL".indexOf(input.charAt(index) || null) >= 0) {
            ++index;
            if ("lL".indexOf(input.charAt(index) || null) >= 0) {
              ++index;
              return "ULL";
            } else {
              raise(null, errors.malformedNumber, input.slice(tokenStart, index));
            }
          } else {
            raise(null, errors.malformedNumber, input.slice(tokenStart, index));
          }
        } else if ("lL".indexOf(input.charAt(index) || null) >= 0) {
          ++index;
          if ("lL".indexOf(input.charAt(index) || null) >= 0) {
            ++index;
            return "LL";
          } else {
            raise(null, errors.malformedNumber, input.slice(tokenStart, index));
          }
        }
      }
      function readHexLiteral() {
        var fraction = 0, binaryExponent = 1, binarySign = 1, digit, fractionStart, exponentStart, digitStart;
        digitStart = index += 2;
        if (!isHexDigit(input.charCodeAt(index)))
          raise(null, errors.malformedNumber, input.slice(tokenStart, index));
        while (isHexDigit(input.charCodeAt(index))) ++index;
        digit = parseInt(input.slice(digitStart, index), 16);
        var foundFraction = false;
        if ("." === input.charAt(index)) {
          foundFraction = true;
          fractionStart = ++index;
          while (isHexDigit(input.charCodeAt(index))) ++index;
          fraction = input.slice(fractionStart, index);
          fraction = fractionStart === index ? 0 : parseInt(fraction, 16) / Math.pow(16, index - fractionStart);
        }
        var foundBinaryExponent = false;
        if ("pP".indexOf(input.charAt(index) || null) >= 0) {
          foundBinaryExponent = true;
          ++index;
          if ("+-".indexOf(input.charAt(index) || null) >= 0)
            binarySign = "+" === input.charAt(index++) ? 1 : -1;
          exponentStart = index;
          if (!isDecDigit(input.charCodeAt(index)))
            raise(null, errors.malformedNumber, input.slice(tokenStart, index));
          while (isDecDigit(input.charCodeAt(index))) ++index;
          binaryExponent = input.slice(exponentStart, index);
          binaryExponent = Math.pow(2, binaryExponent * binarySign);
        }
        return {
          value: (digit + fraction) * binaryExponent,
          hasFractionPart: foundFraction || foundBinaryExponent
        };
      }
      function readDecLiteral() {
        while (isDecDigit(input.charCodeAt(index))) ++index;
        var foundFraction = false;
        if ("." === input.charAt(index)) {
          foundFraction = true;
          ++index;
          while (isDecDigit(input.charCodeAt(index))) ++index;
        }
        var foundExponent = false;
        if ("eE".indexOf(input.charAt(index) || null) >= 0) {
          foundExponent = true;
          ++index;
          if ("+-".indexOf(input.charAt(index) || null) >= 0) ++index;
          if (!isDecDigit(input.charCodeAt(index)))
            raise(null, errors.malformedNumber, input.slice(tokenStart, index));
          while (isDecDigit(input.charCodeAt(index))) ++index;
        }
        return {
          value: parseFloat(input.slice(tokenStart, index)),
          hasFractionPart: foundFraction || foundExponent
        };
      }
      function readUnicodeEscapeSequence() {
        var sequenceStart = index++;
        if (input.charAt(index++) !== "{")
          raise(null, errors.braceExpected, "{", "\\" + input.slice(sequenceStart, index));
        if (!isHexDigit(input.charCodeAt(index)))
          raise(null, errors.hexadecimalDigitExpected, "\\" + input.slice(sequenceStart, index));
        while (input.charCodeAt(index) === 48) ++index;
        var escStart = index;
        while (isHexDigit(input.charCodeAt(index))) {
          ++index;
          if (index - escStart > 6)
            raise(null, errors.tooLargeCodepoint, "\\" + input.slice(sequenceStart, index));
        }
        var b = input.charAt(index++);
        if (b !== "}") {
          if (b === '"' || b === "'")
            raise(null, errors.braceExpected, "}", "\\" + input.slice(sequenceStart, index--));
          else
            raise(null, errors.hexadecimalDigitExpected, "\\" + input.slice(sequenceStart, index));
        }
        var codepoint = parseInt(input.slice(escStart, index - 1) || "0", 16);
        var frag = "\\" + input.slice(sequenceStart, index);
        if (codepoint > 1114111) {
          raise(null, errors.tooLargeCodepoint, frag);
        }
        return encodingMode.encodeUTF8(codepoint, frag);
      }
      function readEscapeSequence() {
        var sequenceStart = index;
        switch (input.charAt(index)) {
          // Lua allow the following escape sequences.
          case "a":
            ++index;
            return "\x07";
          case "n":
            ++index;
            return "\n";
          case "r":
            ++index;
            return "\r";
          case "t":
            ++index;
            return "	";
          case "v":
            ++index;
            return "\v";
          case "b":
            ++index;
            return "\b";
          case "f":
            ++index;
            return "\f";
          // Backslash at the end of the line. We treat all line endings as equivalent,
          // and as representing the [LF] character (code 10). Lua 5.1 through 5.3
          // have been verified to behave the same way.
          case "\r":
          case "\n":
            consumeEOL();
            return "\n";
          case "0":
          case "1":
          case "2":
          case "3":
          case "4":
          case "5":
          case "6":
          case "7":
          case "8":
          case "9":
            while (isDecDigit(input.charCodeAt(index)) && index - sequenceStart < 3) ++index;
            var frag = input.slice(sequenceStart, index);
            var ddd = parseInt(frag, 10);
            if (ddd > 255) {
              raise(null, errors.decimalEscapeTooLarge, "\\" + ddd);
            }
            return encodingMode.encodeByte(ddd, "\\" + frag);
          case "z":
            if (features.skipWhitespaceEscape) {
              ++index;
              skipWhiteSpace();
              return "";
            }
            break;
          case "x":
            if (features.hexEscapes) {
              if (isHexDigit(input.charCodeAt(index + 1)) && isHexDigit(input.charCodeAt(index + 2))) {
                index += 3;
                return encodingMode.encodeByte(parseInt(input.slice(sequenceStart + 1, index), 16), "\\" + input.slice(sequenceStart, index));
              }
              raise(null, errors.hexadecimalDigitExpected, "\\" + input.slice(sequenceStart, index + 2));
            }
            break;
          case "u":
            if (features.unicodeEscapes)
              return readUnicodeEscapeSequence();
            break;
          case "\\":
          case '"':
          case "'":
            return input.charAt(index++);
        }
        if (features.strictEscapes)
          raise(null, errors.invalidEscape, "\\" + input.slice(sequenceStart, index + 1));
        return input.charAt(index++);
      }
      function scanComment() {
        tokenStart = index;
        index += 2;
        var character = input.charAt(index), content = "", isLong = false, commentStart = index, lineStartComment = lineStart, lineComment = line;
        if ("[" === character) {
          content = readLongString(true);
          if (false === content) content = character;
          else isLong = true;
        }
        if (!isLong) {
          while (index < length) {
            if (isLineTerminator(input.charCodeAt(index))) break;
            ++index;
          }
          if (options.comments) content = input.slice(commentStart, index);
        }
        if (options.comments) {
          var node = ast.comment(content, input.slice(tokenStart, index));
          if (options.locations) {
            node.loc = {
              start: { line: lineComment, column: tokenStart - lineStartComment },
              end: { line, column: index - lineStart }
            };
          }
          if (options.ranges) {
            node.range = [tokenStart, index];
          }
          if (options.onCreateNode) options.onCreateNode(node);
          comments.push(node);
        }
      }
      function readLongString(isComment) {
        var level = 0, content = "", terminator = false, character, stringStart, firstLine = line;
        ++index;
        while ("=" === input.charAt(index + level)) ++level;
        if ("[" !== input.charAt(index + level)) return false;
        index += level + 1;
        if (isLineTerminator(input.charCodeAt(index))) consumeEOL();
        stringStart = index;
        while (index < length) {
          while (isLineTerminator(input.charCodeAt(index))) consumeEOL();
          character = input.charAt(index++);
          if ("]" === character) {
            terminator = true;
            for (var i = 0; i < level; ++i) {
              if ("=" !== input.charAt(index + i)) terminator = false;
            }
            if ("]" !== input.charAt(index + level)) terminator = false;
          }
          if (terminator) {
            content += input.slice(stringStart, index - 1);
            index += level + 1;
            return content;
          }
        }
        raise(
          null,
          isComment ? errors.unfinishedLongComment : errors.unfinishedLongString,
          firstLine,
          "<eof>"
        );
      }
      function next() {
        previousToken = token;
        token = lookahead;
        lookahead = lex();
      }
      function consume(value) {
        if (value === token.value) {
          next();
          return true;
        }
        return false;
      }
      function expect(value) {
        if (value === token.value) next();
        else raise(token, errors.expected, value, tokenValue(token));
      }
      function isWhiteSpace(charCode) {
        return 9 === charCode || 32 === charCode || 11 === charCode || 12 === charCode;
      }
      function isLineTerminator(charCode) {
        return 10 === charCode || 13 === charCode;
      }
      function isDecDigit(charCode) {
        return charCode >= 48 && charCode <= 57;
      }
      function isHexDigit(charCode) {
        return charCode >= 48 && charCode <= 57 || charCode >= 97 && charCode <= 102 || charCode >= 65 && charCode <= 70;
      }
      function isIdentifierStart(charCode) {
        if (charCode >= 65 && charCode <= 90 || charCode >= 97 && charCode <= 122 || 95 === charCode)
          return true;
        if (features.extendedIdentifiers && charCode >= 128)
          return true;
        return false;
      }
      function isIdentifierPart(charCode) {
        if (charCode >= 65 && charCode <= 90 || charCode >= 97 && charCode <= 122 || 95 === charCode || charCode >= 48 && charCode <= 57)
          return true;
        if (features.extendedIdentifiers && charCode >= 128)
          return true;
        return false;
      }
      function isKeyword(id) {
        switch (id.length) {
          case 2:
            return "do" === id || "if" === id || "in" === id || "or" === id;
          case 3:
            return "and" === id || "end" === id || "for" === id || "not" === id;
          case 4:
            if ("else" === id || "then" === id)
              return true;
            if (features.labels && !features.contextualGoto)
              return "goto" === id;
            return false;
          case 5:
            return "break" === id || "local" === id || "until" === id || "while" === id;
          case 6:
            return "elseif" === id || "repeat" === id || "return" === id;
          case 8:
            return "function" === id;
        }
        return false;
      }
      function isUnary(token2) {
        if (Punctuator === token2.type) return "#-~".indexOf(token2.value) >= 0;
        if (Keyword === token2.type) return "not" === token2.value;
        return false;
      }
      function isBlockFollow(token2) {
        if (EOF === token2.type) return true;
        if (Keyword !== token2.type) return false;
        switch (token2.value) {
          case "else":
          case "elseif":
          case "end":
          case "until":
            return true;
          default:
            return false;
        }
      }
      var scopes, scopeDepth, globals;
      function createScope() {
        var scope = scopes[scopeDepth++].slice();
        scopes.push(scope);
        if (options.onCreateScope) options.onCreateScope();
      }
      function destroyScope() {
        var scope = scopes.pop();
        --scopeDepth;
        if (options.onDestroyScope) options.onDestroyScope();
      }
      function scopeIdentifierName(name2) {
        if (options.onLocalDeclaration) options.onLocalDeclaration(name2);
        if (-1 !== indexOf(scopes[scopeDepth], name2)) return;
        scopes[scopeDepth].push(name2);
      }
      function scopeIdentifier(node) {
        scopeIdentifierName(node.name);
        attachScope(node, true);
      }
      function attachScope(node, isLocal) {
        if (!isLocal && -1 === indexOfObject(globals, "name", node.name))
          globals.push(node);
        node.isLocal = isLocal;
      }
      function scopeHasName(name2) {
        return -1 !== indexOf(scopes[scopeDepth], name2);
      }
      var locations = [], trackLocations;
      function createLocationMarker() {
        return new Marker(token);
      }
      function Marker(token2) {
        if (options.locations) {
          this.loc = {
            start: {
              line: token2.line,
              column: token2.range[0] - token2.lineStart
            },
            end: {
              line: 0,
              column: 0
            }
          };
        }
        if (options.ranges) this.range = [token2.range[0], 0];
      }
      Marker.prototype.complete = function() {
        if (options.locations) {
          this.loc.end.line = previousToken.lastLine || previousToken.line;
          this.loc.end.column = previousToken.range[1] - (previousToken.lastLineStart || previousToken.lineStart);
        }
        if (options.ranges) {
          this.range[1] = previousToken.range[1];
        }
      };
      Marker.prototype.bless = function(node) {
        if (this.loc) {
          var loc = this.loc;
          node.loc = {
            start: {
              line: loc.start.line,
              column: loc.start.column
            },
            end: {
              line: loc.end.line,
              column: loc.end.column
            }
          };
        }
        if (this.range) {
          node.range = [
            this.range[0],
            this.range[1]
          ];
        }
      };
      function markLocation() {
        if (trackLocations) locations.push(createLocationMarker());
      }
      function pushLocation(marker) {
        if (trackLocations) locations.push(marker);
      }
      function FullFlowContext() {
        this.scopes = [];
        this.pendingGotos = [];
      }
      FullFlowContext.prototype.isInLoop = function() {
        var i = this.scopes.length;
        while (i-- > 0) {
          if (this.scopes[i].isLoop)
            return true;
        }
        return false;
      };
      FullFlowContext.prototype.pushScope = function(isLoop) {
        var scope = {
          labels: {},
          locals: [],
          deferredGotos: [],
          isLoop: !!isLoop
        };
        this.scopes.push(scope);
      };
      FullFlowContext.prototype.popScope = function() {
        for (var i = 0; i < this.pendingGotos.length; ++i) {
          var theGoto = this.pendingGotos[i];
          if (theGoto.maxDepth >= this.scopes.length) {
            if (--theGoto.maxDepth <= 0)
              raise(theGoto.token, errors.labelNotVisible, theGoto.target);
          }
        }
        this.scopes.pop();
      };
      FullFlowContext.prototype.addGoto = function(target2, token2) {
        var localCounts = [];
        for (var i = 0; i < this.scopes.length; ++i) {
          var scope = this.scopes[i];
          localCounts.push(scope.locals.length);
          if (Object.prototype.hasOwnProperty.call(scope.labels, target2))
            return;
        }
        this.pendingGotos.push({
          maxDepth: this.scopes.length,
          target: target2,
          token: token2,
          localCounts
        });
      };
      FullFlowContext.prototype.addLabel = function(name2, token2) {
        var scope = this.currentScope();
        if (Object.prototype.hasOwnProperty.call(scope.labels, name2)) {
          raise(token2, errors.labelAlreadyDefined, name2, scope.labels[name2].line);
        } else {
          var newGotos = [];
          for (var i = 0; i < this.pendingGotos.length; ++i) {
            var theGoto = this.pendingGotos[i];
            if (theGoto.maxDepth >= this.scopes.length && theGoto.target === name2) {
              if (theGoto.localCounts[this.scopes.length - 1] < scope.locals.length) {
                scope.deferredGotos.push(theGoto);
              }
              continue;
            }
            newGotos.push(theGoto);
          }
          this.pendingGotos = newGotos;
        }
        scope.labels[name2] = {
          localCount: scope.locals.length,
          line: token2.line
        };
      };
      FullFlowContext.prototype.addLocal = function(name2, token2) {
        this.currentScope().locals.push({
          name: name2,
          token: token2
        });
      };
      FullFlowContext.prototype.currentScope = function() {
        return this.scopes[this.scopes.length - 1];
      };
      FullFlowContext.prototype.raiseDeferredErrors = function() {
        var scope = this.currentScope();
        var bads = scope.deferredGotos;
        for (var i = 0; i < bads.length; ++i) {
          var theGoto = bads[i];
          raise(theGoto.token, errors.gotoJumpInLocalScope, theGoto.target, scope.locals[theGoto.localCounts[this.scopes.length - 1]].name);
        }
      };
      function LoopFlowContext() {
        this.level = 0;
        this.loopLevels = [];
      }
      LoopFlowContext.prototype.isInLoop = function() {
        return !!this.loopLevels.length;
      };
      LoopFlowContext.prototype.pushScope = function(isLoop) {
        ++this.level;
        if (isLoop)
          this.loopLevels.push(this.level);
      };
      LoopFlowContext.prototype.popScope = function() {
        var levels = this.loopLevels;
        var levlen = levels.length;
        if (levlen) {
          if (levels[levlen - 1] === this.level)
            levels.pop();
        }
        --this.level;
      };
      LoopFlowContext.prototype.addGoto = LoopFlowContext.prototype.addLabel = /* istanbul ignore next */
      function() {
        throw new Error("This should never happen");
      };
      LoopFlowContext.prototype.addLocal = LoopFlowContext.prototype.raiseDeferredErrors = function() {
      };
      function makeFlowContext() {
        return features.labels ? new FullFlowContext() : new LoopFlowContext();
      }
      function parseChunk() {
        next();
        markLocation();
        if (options.scope) createScope();
        var flowContext = makeFlowContext();
        flowContext.allowVararg = true;
        flowContext.pushScope();
        var body = parseBlock(flowContext);
        flowContext.popScope();
        if (options.scope) destroyScope();
        if (EOF !== token.type) unexpected(token);
        if (trackLocations && !body.length) previousToken = token;
        return finishNode(ast.chunk(body));
      }
      function parseBlock(flowContext) {
        var block = [], statement;
        while (!isBlockFollow(token)) {
          if ("return" === token.value || !features.relaxedBreak && "break" === token.value) {
            block.push(parseStatement(flowContext));
            break;
          }
          statement = parseStatement(flowContext);
          consume(";");
          if (statement) block.push(statement);
        }
        return block;
      }
      function parseStatement(flowContext) {
        markLocation();
        if (Punctuator === token.type) {
          if (consume("::")) return parseLabelStatement(flowContext);
        }
        if (features.emptyStatement) {
          if (consume(";")) {
            if (trackLocations) locations.pop();
            return;
          }
        }
        flowContext.raiseDeferredErrors();
        if (Keyword === token.type) {
          switch (token.value) {
            case "local":
              next();
              return parseLocalStatement(flowContext);
            case "if":
              next();
              return parseIfStatement(flowContext);
            case "return":
              next();
              return parseReturnStatement(flowContext);
            case "function":
              next();
              var name2 = parseFunctionName();
              return parseFunctionDeclaration(name2);
            case "while":
              next();
              return parseWhileStatement(flowContext);
            case "for":
              next();
              return parseForStatement(flowContext);
            case "repeat":
              next();
              return parseRepeatStatement(flowContext);
            case "break":
              next();
              if (!flowContext.isInLoop())
                raise(token, errors.noLoopToBreak, token.value);
              return parseBreakStatement();
            case "do":
              next();
              return parseDoStatement(flowContext);
            case "goto":
              next();
              return parseGotoStatement(flowContext);
          }
        }
        if (features.contextualGoto && token.type === Identifier && token.value === "goto" && lookahead.type === Identifier && lookahead.value !== "goto") {
          next();
          return parseGotoStatement(flowContext);
        }
        if (trackLocations) locations.pop();
        return parseAssignmentOrCallStatement(flowContext);
      }
      function parseLabelStatement(flowContext) {
        var nameToken = token, label = parseIdentifier();
        if (options.scope) {
          scopeIdentifierName("::" + nameToken.value + "::");
          attachScope(label, true);
        }
        expect("::");
        flowContext.addLabel(nameToken.value, nameToken);
        return finishNode(ast.labelStatement(label));
      }
      function parseBreakStatement() {
        return finishNode(ast.breakStatement());
      }
      function parseGotoStatement(flowContext) {
        var name2 = token.value, gotoToken = previousToken, label = parseIdentifier();
        flowContext.addGoto(name2, gotoToken);
        return finishNode(ast.gotoStatement(label));
      }
      function parseDoStatement(flowContext) {
        if (options.scope) createScope();
        flowContext.pushScope();
        var body = parseBlock(flowContext);
        flowContext.popScope();
        if (options.scope) destroyScope();
        expect("end");
        return finishNode(ast.doStatement(body));
      }
      function parseWhileStatement(flowContext) {
        var condition = parseExpectedExpression(flowContext);
        expect("do");
        if (options.scope) createScope();
        flowContext.pushScope(true);
        var body = parseBlock(flowContext);
        flowContext.popScope();
        if (options.scope) destroyScope();
        expect("end");
        return finishNode(ast.whileStatement(condition, body));
      }
      function parseRepeatStatement(flowContext) {
        if (options.scope) createScope();
        flowContext.pushScope(true);
        var body = parseBlock(flowContext);
        expect("until");
        flowContext.raiseDeferredErrors();
        var condition = parseExpectedExpression(flowContext);
        flowContext.popScope();
        if (options.scope) destroyScope();
        return finishNode(ast.repeatStatement(condition, body));
      }
      function parseReturnStatement(flowContext) {
        var expressions = [];
        if ("end" !== token.value) {
          var expression = parseExpression(flowContext);
          if (null != expression) expressions.push(expression);
          while (consume(",")) {
            expression = parseExpectedExpression(flowContext);
            expressions.push(expression);
          }
          consume(";");
        }
        return finishNode(ast.returnStatement(expressions));
      }
      function parseIfStatement(flowContext) {
        var clauses = [], condition, body, marker;
        if (trackLocations) {
          marker = locations[locations.length - 1];
          locations.push(marker);
        }
        condition = parseExpectedExpression(flowContext);
        expect("then");
        if (options.scope) createScope();
        flowContext.pushScope();
        body = parseBlock(flowContext);
        flowContext.popScope();
        if (options.scope) destroyScope();
        clauses.push(finishNode(ast.ifClause(condition, body)));
        if (trackLocations) marker = createLocationMarker();
        while (consume("elseif")) {
          pushLocation(marker);
          condition = parseExpectedExpression(flowContext);
          expect("then");
          if (options.scope) createScope();
          flowContext.pushScope();
          body = parseBlock(flowContext);
          flowContext.popScope();
          if (options.scope) destroyScope();
          clauses.push(finishNode(ast.elseifClause(condition, body)));
          if (trackLocations) marker = createLocationMarker();
        }
        if (consume("else")) {
          if (trackLocations) {
            marker = new Marker(previousToken);
            locations.push(marker);
          }
          if (options.scope) createScope();
          flowContext.pushScope();
          body = parseBlock(flowContext);
          flowContext.popScope();
          if (options.scope) destroyScope();
          clauses.push(finishNode(ast.elseClause(body)));
        }
        expect("end");
        return finishNode(ast.ifStatement(clauses));
      }
      function parseForStatement(flowContext) {
        var variable = parseIdentifier(), body;
        if (options.scope) {
          createScope();
          scopeIdentifier(variable);
        }
        if (consume("=")) {
          var start = parseExpectedExpression(flowContext);
          expect(",");
          var end2 = parseExpectedExpression(flowContext);
          var step = consume(",") ? parseExpectedExpression(flowContext) : null;
          expect("do");
          flowContext.pushScope(true);
          body = parseBlock(flowContext);
          flowContext.popScope();
          expect("end");
          if (options.scope) destroyScope();
          return finishNode(ast.forNumericStatement(variable, start, end2, step, body));
        } else {
          var variables = [variable];
          while (consume(",")) {
            variable = parseIdentifier();
            if (options.scope) scopeIdentifier(variable);
            variables.push(variable);
          }
          expect("in");
          var iterators = [];
          do {
            var expression = parseExpectedExpression(flowContext);
            iterators.push(expression);
          } while (consume(","));
          expect("do");
          flowContext.pushScope(true);
          body = parseBlock(flowContext);
          flowContext.popScope();
          expect("end");
          if (options.scope) destroyScope();
          return finishNode(ast.forGenericStatement(variables, iterators, body));
        }
      }
      function parseLocalStatement(flowContext) {
        var name2, declToken = previousToken;
        if (Identifier === token.type) {
          var variables = [], init = [];
          do {
            name2 = parseIdentifier();
            variables.push(name2);
            flowContext.addLocal(name2.name, declToken);
          } while (consume(","));
          if (consume("=")) {
            do {
              var expression = parseExpectedExpression(flowContext);
              init.push(expression);
            } while (consume(","));
          }
          if (options.scope) {
            for (var i = 0, l = variables.length; i < l; ++i) {
              scopeIdentifier(variables[i]);
            }
          }
          return finishNode(ast.localStatement(variables, init));
        }
        if (consume("function")) {
          name2 = parseIdentifier();
          flowContext.addLocal(name2.name, declToken);
          if (options.scope) {
            scopeIdentifier(name2);
            createScope();
          }
          return parseFunctionDeclaration(name2, true);
        } else {
          raiseUnexpectedToken("<name>", token);
        }
      }
      function parseAssignmentOrCallStatement(flowContext) {
        var previous = token, marker, startMarker;
        var lvalue, base, name2;
        var targets = [];
        if (trackLocations) startMarker = createLocationMarker();
        do {
          if (trackLocations) marker = createLocationMarker();
          if (Identifier === token.type) {
            name2 = token.value;
            base = parseIdentifier();
            if (options.scope) attachScope(base, scopeHasName(name2));
            lvalue = true;
          } else if ("(" === token.value) {
            next();
            base = parseExpectedExpression(flowContext);
            expect(")");
            lvalue = false;
          } else {
            return unexpected(token);
          }
          both: for (; ; ) {
            var newBase;
            switch (StringLiteral === token.type ? '"' : token.value) {
              case ".":
              case "[":
                lvalue = true;
                break;
              case ":":
              case "(":
              case "{":
              case '"':
                lvalue = null;
                break;
              default:
                break both;
            }
            base = parsePrefixExpressionPart(base, marker, flowContext);
          }
          targets.push(base);
          if ("," !== token.value)
            break;
          if (!lvalue) {
            return unexpected(token);
          }
          next();
        } while (true);
        if (targets.length === 1 && lvalue === null) {
          pushLocation(marker);
          return finishNode(ast.callStatement(targets[0]));
        } else if (!lvalue) {
          return unexpected(token);
        }
        expect("=");
        var values = [];
        do {
          values.push(parseExpectedExpression(flowContext));
        } while (consume(","));
        pushLocation(startMarker);
        return finishNode(ast.assignmentStatement(targets, values));
      }
      function parseIdentifier() {
        markLocation();
        var identifier = token.value;
        if (Identifier !== token.type) raiseUnexpectedToken("<name>", token);
        next();
        return finishNode(ast.identifier(identifier));
      }
      function parseFunctionDeclaration(name2, isLocal) {
        var flowContext = makeFlowContext();
        flowContext.pushScope();
        var parameters = [];
        expect("(");
        if (!consume(")")) {
          while (true) {
            if (Identifier === token.type) {
              var parameter = parseIdentifier();
              if (options.scope) scopeIdentifier(parameter);
              parameters.push(parameter);
              if (consume(",")) continue;
            } else if (VarargLiteral === token.type) {
              flowContext.allowVararg = true;
              parameters.push(parsePrimaryExpression(flowContext));
            } else {
              raiseUnexpectedToken("<name> or '...'", token);
            }
            expect(")");
            break;
          }
        }
        var body = parseBlock(flowContext);
        flowContext.popScope();
        expect("end");
        if (options.scope) destroyScope();
        isLocal = isLocal || false;
        return finishNode(ast.functionStatement(name2, parameters, isLocal, body));
      }
      function parseFunctionName() {
        var base, name2, marker;
        if (trackLocations) marker = createLocationMarker();
        base = parseIdentifier();
        if (options.scope) {
          attachScope(base, scopeHasName(base.name));
          createScope();
        }
        while (consume(".")) {
          pushLocation(marker);
          name2 = parseIdentifier();
          base = finishNode(ast.memberExpression(base, ".", name2));
        }
        if (consume(":")) {
          pushLocation(marker);
          name2 = parseIdentifier();
          base = finishNode(ast.memberExpression(base, ":", name2));
          if (options.scope) scopeIdentifierName("self");
        }
        return base;
      }
      function parseTableConstructor(flowContext) {
        var fields = [], key, value;
        while (true) {
          markLocation();
          if (Punctuator === token.type && consume("[")) {
            key = parseExpectedExpression(flowContext);
            expect("]");
            expect("=");
            value = parseExpectedExpression(flowContext);
            fields.push(finishNode(ast.tableKey(key, value)));
          } else if (Identifier === token.type) {
            if ("=" === lookahead.value) {
              key = parseIdentifier();
              next();
              value = parseExpectedExpression(flowContext);
              fields.push(finishNode(ast.tableKeyString(key, value)));
            } else {
              value = parseExpectedExpression(flowContext);
              fields.push(finishNode(ast.tableValue(value)));
            }
          } else {
            if (null == (value = parseExpression(flowContext))) {
              locations.pop();
              break;
            }
            fields.push(finishNode(ast.tableValue(value)));
          }
          if (",;".indexOf(token.value) >= 0) {
            next();
            continue;
          }
          break;
        }
        expect("}");
        return finishNode(ast.tableConstructorExpression(fields));
      }
      function parseExpression(flowContext) {
        var expression = parseSubExpression(0, flowContext);
        return expression;
      }
      function parseExpectedExpression(flowContext) {
        var expression = parseExpression(flowContext);
        if (null == expression) raiseUnexpectedToken("<expression>", token);
        else return expression;
      }
      function binaryPrecedence(operator) {
        var charCode = operator.charCodeAt(0), length2 = operator.length;
        if (1 === length2) {
          switch (charCode) {
            case 94:
              return 12;
            // ^
            case 42:
            case 47:
            case 37:
              return 10;
            // * / %
            case 43:
            case 45:
              return 9;
            // + -
            case 38:
              return 6;
            // &
            case 126:
              return 5;
            // ~
            case 124:
              return 4;
            // |
            case 60:
            case 62:
              return 3;
          }
        } else if (2 === length2) {
          switch (charCode) {
            case 47:
              return 10;
            // //
            case 46:
              return 8;
            // ..
            case 60:
            case 62:
              if ("<<" === operator || ">>" === operator) return 7;
              return 3;
            // <= >=
            case 61:
            case 126:
              return 3;
            // == ~=
            case 111:
              return 1;
          }
        } else if (97 === charCode && "and" === operator) return 2;
        return 0;
      }
      function parseSubExpression(minPrecedence, flowContext) {
        var operator = token.value, expression, marker;
        if (trackLocations) marker = createLocationMarker();
        if (isUnary(token)) {
          markLocation();
          next();
          var argument = parseSubExpression(10, flowContext);
          if (argument == null) raiseUnexpectedToken("<expression>", token);
          expression = finishNode(ast.unaryExpression(operator, argument));
        }
        if (null == expression) {
          expression = parsePrimaryExpression(flowContext);
          if (null == expression) {
            expression = parsePrefixExpression(flowContext);
          }
        }
        if (null == expression) return null;
        var precedence;
        while (true) {
          operator = token.value;
          precedence = Punctuator === token.type || Keyword === token.type ? binaryPrecedence(operator) : 0;
          if (precedence === 0 || precedence <= minPrecedence) break;
          if ("^" === operator || ".." === operator) --precedence;
          next();
          var right = parseSubExpression(precedence, flowContext);
          if (null == right) raiseUnexpectedToken("<expression>", token);
          if (trackLocations) locations.push(marker);
          expression = finishNode(ast.binaryExpression(operator, expression, right));
        }
        return expression;
      }
      function parsePrefixExpressionPart(base, marker, flowContext) {
        var expression, identifier;
        if (Punctuator === token.type) {
          switch (token.value) {
            case "[":
              pushLocation(marker);
              next();
              expression = parseExpectedExpression(flowContext);
              expect("]");
              return finishNode(ast.indexExpression(base, expression));
            case ".":
              pushLocation(marker);
              next();
              identifier = parseIdentifier();
              return finishNode(ast.memberExpression(base, ".", identifier));
            case ":":
              pushLocation(marker);
              next();
              identifier = parseIdentifier();
              base = finishNode(ast.memberExpression(base, ":", identifier));
              pushLocation(marker);
              return parseCallExpression(base, flowContext);
            case "(":
            case "{":
              pushLocation(marker);
              return parseCallExpression(base, flowContext);
          }
        } else if (StringLiteral === token.type) {
          pushLocation(marker);
          return parseCallExpression(base, flowContext);
        }
        return null;
      }
      function parsePrefixExpression(flowContext) {
        var base, name2, marker;
        if (trackLocations) marker = createLocationMarker();
        if (Identifier === token.type) {
          name2 = token.value;
          base = parseIdentifier();
          if (options.scope) attachScope(base, scopeHasName(name2));
        } else if (consume("(")) {
          base = parseExpectedExpression(flowContext);
          expect(")");
        } else {
          return null;
        }
        for (; ; ) {
          var newBase = parsePrefixExpressionPart(base, marker, flowContext);
          if (newBase === null)
            break;
          base = newBase;
        }
        return base;
      }
      function parseCallExpression(base, flowContext) {
        if (Punctuator === token.type) {
          switch (token.value) {
            case "(":
              if (!features.emptyStatement) {
                if (token.line !== previousToken.line)
                  raise(null, errors.ambiguousSyntax, token.value);
              }
              next();
              var expressions = [];
              var expression = parseExpression(flowContext);
              if (null != expression) expressions.push(expression);
              while (consume(",")) {
                expression = parseExpectedExpression(flowContext);
                expressions.push(expression);
              }
              expect(")");
              return finishNode(ast.callExpression(base, expressions));
            case "{":
              markLocation();
              next();
              var table = parseTableConstructor(flowContext);
              return finishNode(ast.tableCallExpression(base, table));
          }
        } else if (StringLiteral === token.type) {
          return finishNode(ast.stringCallExpression(base, parsePrimaryExpression(flowContext)));
        }
        raiseUnexpectedToken("function arguments", token);
      }
      function parsePrimaryExpression(flowContext) {
        var literals = StringLiteral | NumericLiteral | BooleanLiteral | NilLiteral | VarargLiteral, value = token.value, type = token.type, marker;
        if (trackLocations) marker = createLocationMarker();
        if (type === VarargLiteral && !flowContext.allowVararg) {
          raise(token, errors.cannotUseVararg, token.value);
        }
        if (type & literals) {
          pushLocation(marker);
          var raw = input.slice(token.range[0], token.range[1]);
          next();
          return finishNode(ast.literal(type, value, raw));
        } else if (Keyword === type && "function" === value) {
          pushLocation(marker);
          next();
          if (options.scope) createScope();
          return parseFunctionDeclaration(null);
        } else if (consume("{")) {
          pushLocation(marker);
          return parseTableConstructor(flowContext);
        }
      }
      exports2.parse = parse;
      var versionFeatures = {
        "5.1": {},
        "5.2": {
          labels: true,
          emptyStatement: true,
          hexEscapes: true,
          skipWhitespaceEscape: true,
          strictEscapes: true,
          relaxedBreak: true
        },
        "5.3": {
          labels: true,
          emptyStatement: true,
          hexEscapes: true,
          skipWhitespaceEscape: true,
          strictEscapes: true,
          unicodeEscapes: true,
          bitwiseOperators: true,
          integerDivision: true,
          relaxedBreak: true
        },
        "LuaJIT": {
          // XXX: LuaJIT language features may depend on compilation options; may need to
          // rethink how to handle this. Specifically, there is a LUAJIT_ENABLE_LUA52COMPAT
          // that removes contextual goto. Maybe add 'LuaJIT-5.2compat' as well?
          labels: true,
          contextualGoto: true,
          hexEscapes: true,
          skipWhitespaceEscape: true,
          strictEscapes: true,
          unicodeEscapes: true,
          imaginaryNumbers: true,
          integerSuffixes: true
        }
      };
      function parse(_input, _options) {
        if ("undefined" === typeof _options && "object" === typeof _input) {
          _options = _input;
          _input = void 0;
        }
        if (!_options) _options = {};
        input = _input || "";
        options = assign({}, defaultOptions2, _options);
        index = 0;
        line = 1;
        lineStart = 0;
        length = input.length;
        scopes = [[]];
        scopeDepth = 0;
        globals = [];
        locations = [];
        if (!Object.prototype.hasOwnProperty.call(versionFeatures, options.luaVersion)) {
          throw new Error(sprintf("Lua version '%1' not supported", options.luaVersion));
        }
        features = assign({}, versionFeatures[options.luaVersion]);
        if (options.extendedIdentifiers !== void 0)
          features.extendedIdentifiers = !!options.extendedIdentifiers;
        if (!Object.prototype.hasOwnProperty.call(encodingModes, options.encodingMode)) {
          throw new Error(sprintf("Encoding mode '%1' not supported", options.encodingMode));
        }
        encodingMode = encodingModes[options.encodingMode];
        if (options.comments) comments = [];
        if (!options.wait) return end();
        return exports2;
      }
      exports2.write = write;
      function write(_input) {
        input += String(_input);
        length = input.length;
        return exports2;
      }
      exports2.end = end;
      function end(_input) {
        if ("undefined" !== typeof _input) write(_input);
        if (input && input.substr(0, 2) === "#!") input = input.replace(/^.*/, function(line2) {
          return line2.replace(/./g, " ");
        });
        length = input.length;
        trackLocations = options.locations || options.ranges;
        lookahead = lex();
        var chunk = parseChunk();
        if (options.comments) chunk.comments = comments;
        if (options.scope) chunk.globals = globals;
        if (locations.length > 0)
          throw new Error("Location tracking failed. This is most likely a bug in luaparse");
        return chunk;
      }
    });
  }
});

// src/profile.js
var import_luaparse = __toESM(require_luaparse(), 1);

// node_modules/cbor-x/decode.js
var decoder;
try {
  decoder = new TextDecoder();
} catch (error) {
}
var src;
var srcEnd;
var position = 0;
var EMPTY_ARRAY = [];
var LEGACY_RECORD_INLINE_ID = 105;
var RECORD_DEFINITIONS_ID = 57342;
var RECORD_INLINE_ID = 57343;
var BUNDLED_STRINGS_ID = 57337;
var PACKED_REFERENCE_TAG_ID = 6;
var STOP_CODE = {};
var maxArraySize = 11281e4;
var maxMapSize = 1681e4;
var strings = EMPTY_ARRAY;
var stringPosition = 0;
var currentDecoder = {};
var currentStructures;
var srcString;
var srcStringStart = 0;
var srcStringEnd = 0;
var bundledStrings;
var referenceMap;
var currentExtensions = [];
var currentExtensionRanges = [];
var packedValues;
var dataView;
var restoreMapsAsObject;
var defaultOptions = {
  useRecords: false,
  mapsAsObjects: true
};
var sequentialMode = false;
var inlineObjectReadThreshold = 2;
try {
  new Function("");
} catch (error) {
  inlineObjectReadThreshold = Infinity;
}
var Decoder = class _Decoder {
  constructor(options) {
    if (options) {
      if ((options.keyMap || options._keyMap) && !options.useRecords) {
        options.useRecords = false;
        options.mapsAsObjects = true;
      }
      if (options.useRecords === false && options.mapsAsObjects === void 0)
        options.mapsAsObjects = true;
      if (options.getStructures)
        options.getShared = options.getStructures;
      if (options.getShared && !options.structures)
        (options.structures = []).uninitialized = true;
      if (options.keyMap) {
        this.mapKey = /* @__PURE__ */ new Map();
        for (let [k, v] of Object.entries(options.keyMap)) this.mapKey.set(v, k);
      }
    }
    Object.assign(this, options);
  }
  /*
  decodeKey(key) {
  	return this.keyMap
  		? Object.keys(this.keyMap)[Object.values(this.keyMap).indexOf(key)] || key
  		: key
  }
  */
  decodeKey(key) {
    return this.keyMap ? this.mapKey.get(key) || key : key;
  }
  encodeKey(key) {
    return this.keyMap && this.keyMap.hasOwnProperty(key) ? this.keyMap[key] : key;
  }
  encodeKeys(rec) {
    if (!this._keyMap) return rec;
    let map = /* @__PURE__ */ new Map();
    for (let [k, v] of Object.entries(rec)) map.set(this._keyMap.hasOwnProperty(k) ? this._keyMap[k] : k, v);
    return map;
  }
  decodeKeys(map) {
    if (!this._keyMap || map.constructor.name != "Map") return map;
    if (!this._mapKey) {
      this._mapKey = /* @__PURE__ */ new Map();
      for (let [k, v] of Object.entries(this._keyMap)) this._mapKey.set(v, k);
    }
    let res = {};
    map.forEach((v, k) => res[safeKey(this._mapKey.has(k) ? this._mapKey.get(k) : k)] = v);
    return res;
  }
  mapDecode(source2, end) {
    let res = this.decode(source2);
    if (this._keyMap) {
      switch (res.constructor.name) {
        case "Array":
          return res.map((r) => this.decodeKeys(r));
      }
    }
    return res;
  }
  decode(source2, end) {
    if (src) {
      return saveState(() => {
        clearSource();
        return this ? this.decode(source2, end) : _Decoder.prototype.decode.call(defaultOptions, source2, end);
      });
    }
    srcEnd = end > -1 ? end : source2.length;
    position = 0;
    stringPosition = 0;
    srcStringEnd = 0;
    srcString = null;
    strings = EMPTY_ARRAY;
    bundledStrings = null;
    src = source2;
    try {
      dataView = source2.dataView || (source2.dataView = new DataView(source2.buffer, source2.byteOffset, source2.byteLength));
    } catch (error) {
      src = null;
      if (source2 instanceof Uint8Array)
        throw error;
      throw new Error("Source must be a Uint8Array or Buffer but was a " + (source2 && typeof source2 == "object" ? source2.constructor.name : typeof source2));
    }
    if (this instanceof _Decoder) {
      currentDecoder = this;
      packedValues = this.sharedValues && (this.pack ? new Array(this.maxPrivatePackedValues || 16).concat(this.sharedValues) : this.sharedValues);
      if (this.structures) {
        currentStructures = this.structures;
        return checkedRead();
      } else if (!currentStructures || currentStructures.length > 0) {
        currentStructures = [];
      }
    } else {
      currentDecoder = defaultOptions;
      if (!currentStructures || currentStructures.length > 0)
        currentStructures = [];
      packedValues = null;
    }
    return checkedRead();
  }
  decodeMultiple(source2, forEach) {
    let values, lastPosition = 0;
    try {
      let size = source2.length;
      sequentialMode = true;
      let value = this ? this.decode(source2, size) : defaultDecoder.decode(source2, size);
      if (forEach) {
        if (forEach(value) === false) {
          return;
        }
        while (position < size) {
          lastPosition = position;
          if (forEach(checkedRead()) === false) {
            return;
          }
        }
      } else {
        values = [value];
        while (position < size) {
          lastPosition = position;
          values.push(checkedRead());
        }
        return values;
      }
    } catch (error) {
      error.lastPosition = lastPosition;
      error.values = values;
      throw error;
    } finally {
      sequentialMode = false;
      clearSource();
    }
  }
};
function checkedRead() {
  try {
    let result = read();
    if (bundledStrings) {
      if (position >= bundledStrings.postBundlePosition) {
        let error = new Error("Unexpected bundle position");
        error.incomplete = true;
        throw error;
      }
      position = bundledStrings.postBundlePosition;
      bundledStrings = null;
    }
    if (position == srcEnd) {
      currentStructures = null;
      src = null;
      if (referenceMap)
        referenceMap = null;
    } else if (position > srcEnd) {
      let error = new Error("Unexpected end of CBOR data");
      error.incomplete = true;
      throw error;
    } else if (!sequentialMode) {
      throw new Error("Data read, but end of buffer not reached");
    }
    return result;
  } catch (error) {
    clearSource();
    if (error instanceof RangeError || error.message.startsWith("Unexpected end of buffer")) {
      error.incomplete = true;
    }
    throw error;
  }
}
function endOfCBORError() {
  let error = new Error("Unexpected end of CBOR data");
  error.incomplete = true;
  return error;
}
function read() {
  if (!(position < srcEnd)) throw endOfCBORError();
  let token = src[position++];
  let majorType = token >> 5;
  token = token & 31;
  if (token > 23) {
    switch (token) {
      case 24:
        if (position >= srcEnd) throw endOfCBORError();
        token = src[position++];
        break;
      case 25:
        if (majorType == 7) {
          return getFloat16();
        }
        token = dataView.getUint16(position);
        position += 2;
        break;
      case 26:
        if (majorType == 7) {
          let value = dataView.getFloat32(position);
          if (currentDecoder.useFloat32 > 2) {
            let multiplier = mult10[(src[position] & 127) << 1 | src[position + 1] >> 7];
            position += 4;
            return (multiplier * value + (value > 0 ? 0.5 : -0.5) >> 0) / multiplier;
          }
          position += 4;
          return value;
        }
        token = dataView.getUint32(position);
        position += 4;
        if (majorType === 1) return -1 - token;
        break;
      case 27:
        if (majorType == 7) {
          let value = dataView.getFloat64(position);
          position += 8;
          return value;
        }
        if (majorType > 1) {
          if (dataView.getUint32(position) > 0)
            throw new Error("JavaScript does not support arrays, maps, or strings with length over 4294967295");
          token = dataView.getUint32(position + 4);
        } else if (currentDecoder.int64AsNumber) {
          token = dataView.getUint32(position) * 4294967296;
          token += dataView.getUint32(position + 4);
        } else token = dataView.getBigUint64(position);
        position += 8;
        break;
      case 31:
        switch (majorType) {
          case 2:
          // byte string
          case 3:
            throw new Error("Indefinite length not supported for byte or text strings");
          case 4:
            let array = [];
            let value, i = 0;
            while ((value = read()) != STOP_CODE) {
              if (i >= maxArraySize) throw new Error(`Array length exceeds ${maxArraySize}`);
              array[i++] = value;
            }
            return majorType == 4 ? array : majorType == 3 ? array.join("") : Buffer.concat(array);
          case 5:
            let key;
            if (currentDecoder.mapsAsObjects) {
              let object = {};
              let i2 = 0;
              if (currentDecoder.keyMap) {
                while ((key = read()) != STOP_CODE) {
                  if (i2++ >= maxMapSize) throw new Error(`Property count exceeds ${maxMapSize}`);
                  object[safeKey(currentDecoder.decodeKey(key))] = read();
                }
              } else {
                while ((key = read()) != STOP_CODE) {
                  if (i2++ >= maxMapSize) throw new Error(`Property count exceeds ${maxMapSize}`);
                  object[safeKey(key)] = read();
                }
              }
              return object;
            } else {
              if (restoreMapsAsObject) {
                currentDecoder.mapsAsObjects = true;
                restoreMapsAsObject = false;
              }
              let map = /* @__PURE__ */ new Map();
              if (currentDecoder.keyMap) {
                let i2 = 0;
                while ((key = read()) != STOP_CODE) {
                  if (i2++ >= maxMapSize) {
                    throw new Error(`Map size exceeds ${maxMapSize}`);
                  }
                  map.set(currentDecoder.decodeKey(key), read());
                }
              } else {
                let i2 = 0;
                while ((key = read()) != STOP_CODE) {
                  if (i2++ >= maxMapSize) {
                    throw new Error(`Map size exceeds ${maxMapSize}`);
                  }
                  map.set(key, read());
                }
              }
              return map;
            }
          case 7:
            return STOP_CODE;
          default:
            throw new Error("Invalid major type for indefinite length " + majorType);
        }
      default:
        throw new Error("Unknown token " + token);
    }
  }
  switch (majorType) {
    case 0:
      return token;
    case 1:
      return ~token;
    case 2:
      return readBin(token);
    case 3:
      if (srcStringEnd >= position) {
        return srcString.slice(position - srcStringStart, (position += token) - srcStringStart);
      }
      if (srcStringEnd == 0 && srcEnd < 140 && token < 32) {
        let string = token < 16 ? shortStringInJS(token) : longStringInJS(token);
        if (string != null)
          return string;
      }
      return readFixedString(token);
    case 4:
      if (token >= maxArraySize) throw new Error(`Array length exceeds ${maxArraySize}`);
      if (token > srcEnd - position) throw endOfCBORError();
      let array = new Array(token);
      for (let i = 0; i < token; i++) array[i] = read();
      return array;
    case 5:
      if (token >= maxMapSize) throw new Error(`Map size exceeds ${maxArraySize}`);
      if (token > (srcEnd - position) / 2) throw endOfCBORError();
      if (currentDecoder.mapsAsObjects) {
        let object = {};
        if (currentDecoder.keyMap) for (let i = 0; i < token; i++) object[safeKey(currentDecoder.decodeKey(read()))] = read();
        else for (let i = 0; i < token; i++) object[safeKey(read())] = read();
        return object;
      } else {
        if (restoreMapsAsObject) {
          currentDecoder.mapsAsObjects = true;
          restoreMapsAsObject = false;
        }
        let map = /* @__PURE__ */ new Map();
        if (currentDecoder.keyMap) for (let i = 0; i < token; i++) map.set(currentDecoder.decodeKey(read()), read());
        else for (let i = 0; i < token; i++) map.set(read(), read());
        return map;
      }
    case 6:
      if (token >= BUNDLED_STRINGS_ID) {
        let structure = currentStructures[token & 8191];
        if (structure) {
          if (!structure.read) structure.read = createStructureReader(structure);
          return structure.read();
        }
        if (token < 65536) {
          if (token == RECORD_INLINE_ID) {
            let length = readJustLength();
            let id = read();
            let structure2 = read();
            recordDefinition(id, structure2);
            let object = {};
            if (currentDecoder.keyMap) for (let i = 2; i < length; i++) {
              let key = currentDecoder.decodeKey(structure2[i - 2]);
              object[safeKey(key)] = read();
            }
            else for (let i = 2; i < length; i++) {
              let key = structure2[i - 2];
              object[safeKey(key)] = read();
            }
            return object;
          } else if (token == RECORD_DEFINITIONS_ID) {
            let length = readJustLength();
            let id = read();
            for (let i = 2; i < length; i++) {
              recordDefinition(id++, read());
            }
            return read();
          } else if (token == BUNDLED_STRINGS_ID) {
            return readBundleExt();
          }
          if (currentDecoder.getShared) {
            loadShared();
            structure = currentStructures[token & 8191];
            if (structure) {
              if (!structure.read)
                structure.read = createStructureReader(structure);
              return structure.read();
            }
          }
        }
      }
      let extension = currentExtensions[token];
      if (extension) {
        if (extension.handlesRead)
          return extension(read);
        else
          return extension(read());
      } else {
        let input = read();
        for (let i = 0; i < currentExtensionRanges.length; i++) {
          let value = currentExtensionRanges[i](token, input);
          if (value !== void 0)
            return value;
        }
        return new Tag(input, token);
      }
    case 7:
      switch (token) {
        case 20:
          return false;
        case 21:
          return true;
        case 22:
          return null;
        case 23:
          return;
        // undefined
        case 31:
        default:
          let packedValue = (packedValues || getPackedValues())[token];
          if (packedValue !== void 0)
            return packedValue;
          throw new Error("Unknown token " + token);
      }
    default:
      if (isNaN(token)) throw endOfCBORError();
      throw new Error("Unknown CBOR token " + token);
  }
}
var validName = /^[a-zA-Z_$][a-zA-Z\d_$]*$/;
function createStructureReader(structure) {
  if (!structure) throw new Error("Structure is required in record definition");
  function readObject() {
    let length = src[position++];
    length = length & 31;
    if (length > 23) {
      switch (length) {
        case 24:
          length = src[position++];
          break;
        case 25:
          length = dataView.getUint16(position);
          position += 2;
          break;
        case 26:
          length = dataView.getUint32(position);
          position += 4;
          break;
        default:
          throw new Error("Expected array header, but got " + src[position - 1]);
      }
    }
    let compiledReader = this.compiledReader;
    while (compiledReader) {
      if (compiledReader.propertyCount === length)
        return compiledReader(read);
      compiledReader = compiledReader.next;
    }
    if (this.slowReads++ >= inlineObjectReadThreshold) {
      let array = this.length == length ? this : this.slice(0, length);
      compiledReader = currentDecoder.keyMap ? new Function("r", "return {" + array.map((k) => currentDecoder.decodeKey(k)).map((k) => validName.test(k) ? safeKey(k) + ":r()" : "[" + JSON.stringify(k) + "]:r()").join(",") + "}") : new Function("r", "return {" + array.map((key) => validName.test(key) ? safeKey(key) + ":r()" : "[" + JSON.stringify(key) + "]:r()").join(",") + "}");
      if (this.compiledReader)
        compiledReader.next = this.compiledReader;
      compiledReader.propertyCount = length;
      this.compiledReader = compiledReader;
      return compiledReader(read);
    }
    let object = {};
    if (currentDecoder.keyMap) for (let i = 0; i < length; i++) object[safeKey(currentDecoder.decodeKey(this[i]))] = read();
    else for (let i = 0; i < length; i++) {
      object[safeKey(this[i])] = read();
    }
    return object;
  }
  structure.slowReads = 0;
  return readObject;
}
function safeKey(key) {
  if (typeof key === "string") return key === "__proto__" ? "__proto_" : key;
  if (typeof key === "number" || typeof key === "boolean" || typeof key === "bigint") return key.toString();
  if (key == null) return key + "";
  throw new Error("Invalid property name type " + typeof key);
}
var readFixedString = readStringJS;
function readStringJS(length) {
  let result;
  if (length < 16) {
    if (result = shortStringInJS(length))
      return result;
  }
  if (length > 64 && decoder)
    return decoder.decode(src.subarray(position, position += length));
  const end = position + length;
  const units = [];
  result = "";
  while (position < end) {
    const byte1 = src[position++];
    if ((byte1 & 128) === 0) {
      units.push(byte1);
    } else if ((byte1 & 224) === 192) {
      if (byte1 < 194 || position >= end || (src[position] & 192) !== 128) {
        units.push(65533);
      } else {
        const byte2 = src[position++] & 63;
        units.push((byte1 & 31) << 6 | byte2);
      }
    } else if ((byte1 & 240) === 224) {
      const byte2 = position < end ? src[position] : 0;
      if (position >= end || (byte2 & 192) !== 128 || byte1 === 224 && byte2 < 160 || byte1 === 237 && byte2 >= 160) {
        units.push(65533);
      } else {
        position++;
        if (position >= end || (src[position] & 192) !== 128) {
          units.push(65533);
        } else {
          const byte3 = src[position++] & 63;
          units.push((byte1 & 31) << 12 | (byte2 & 63) << 6 | byte3);
        }
      }
    } else if ((byte1 & 248) === 240) {
      const byte2 = position < end ? src[position] : 0;
      if (byte1 > 244 || position >= end || (byte2 & 192) !== 128 || byte1 === 240 && byte2 < 144 || byte1 === 244 && byte2 >= 144) {
        units.push(65533);
      } else {
        position++;
        if (position >= end || (src[position] & 192) !== 128) {
          units.push(65533);
        } else {
          const byte3 = src[position++] & 63;
          if (position >= end || (src[position] & 192) !== 128) {
            units.push(65533);
          } else {
            const byte4 = src[position++] & 63;
            let unit2 = (byte1 & 7) << 18 | (byte2 & 63) << 12 | byte3 << 6 | byte4;
            unit2 -= 65536;
            units.push(unit2 >>> 10 & 1023 | 55296);
            units.push(56320 | unit2 & 1023);
          }
        }
      }
    } else {
      units.push(65533);
    }
    if (units.length >= 4096) {
      result += fromCharCode.apply(String, units);
      units.length = 0;
    }
  }
  if (units.length > 0) {
    result += fromCharCode.apply(String, units);
  }
  return result;
}
var fromCharCode = String.fromCharCode;
function longStringInJS(length) {
  let start = position;
  let bytes = new Array(length);
  for (let i = 0; i < length; i++) {
    const byte = src[position++];
    if ((byte & 128) > 0) {
      position = start;
      return;
    }
    bytes[i] = byte;
  }
  return fromCharCode.apply(String, bytes);
}
function shortStringInJS(length) {
  if (length < 4) {
    if (length < 2) {
      if (length === 0)
        return "";
      else {
        let a = src[position++];
        if ((a & 128) > 1) {
          position -= 1;
          return;
        }
        return fromCharCode(a);
      }
    } else {
      let a = src[position++];
      let b = src[position++];
      if ((a & 128) > 0 || (b & 128) > 0) {
        position -= 2;
        return;
      }
      if (length < 3)
        return fromCharCode(a, b);
      let c = src[position++];
      if ((c & 128) > 0) {
        position -= 3;
        return;
      }
      return fromCharCode(a, b, c);
    }
  } else {
    let a = src[position++];
    let b = src[position++];
    let c = src[position++];
    let d = src[position++];
    if ((a & 128) > 0 || (b & 128) > 0 || (c & 128) > 0 || (d & 128) > 0) {
      position -= 4;
      return;
    }
    if (length < 6) {
      if (length === 4)
        return fromCharCode(a, b, c, d);
      else {
        let e = src[position++];
        if ((e & 128) > 0) {
          position -= 5;
          return;
        }
        return fromCharCode(a, b, c, d, e);
      }
    } else if (length < 8) {
      let e = src[position++];
      let f = src[position++];
      if ((e & 128) > 0 || (f & 128) > 0) {
        position -= 6;
        return;
      }
      if (length < 7)
        return fromCharCode(a, b, c, d, e, f);
      let g = src[position++];
      if ((g & 128) > 0) {
        position -= 7;
        return;
      }
      return fromCharCode(a, b, c, d, e, f, g);
    } else {
      let e = src[position++];
      let f = src[position++];
      let g = src[position++];
      let h = src[position++];
      if ((e & 128) > 0 || (f & 128) > 0 || (g & 128) > 0 || (h & 128) > 0) {
        position -= 8;
        return;
      }
      if (length < 10) {
        if (length === 8)
          return fromCharCode(a, b, c, d, e, f, g, h);
        else {
          let i = src[position++];
          if ((i & 128) > 0) {
            position -= 9;
            return;
          }
          return fromCharCode(a, b, c, d, e, f, g, h, i);
        }
      } else if (length < 12) {
        let i = src[position++];
        let j = src[position++];
        if ((i & 128) > 0 || (j & 128) > 0) {
          position -= 10;
          return;
        }
        if (length < 11)
          return fromCharCode(a, b, c, d, e, f, g, h, i, j);
        let k = src[position++];
        if ((k & 128) > 0) {
          position -= 11;
          return;
        }
        return fromCharCode(a, b, c, d, e, f, g, h, i, j, k);
      } else {
        let i = src[position++];
        let j = src[position++];
        let k = src[position++];
        let l = src[position++];
        if ((i & 128) > 0 || (j & 128) > 0 || (k & 128) > 0 || (l & 128) > 0) {
          position -= 12;
          return;
        }
        if (length < 14) {
          if (length === 12)
            return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l);
          else {
            let m = src[position++];
            if ((m & 128) > 0) {
              position -= 13;
              return;
            }
            return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l, m);
          }
        } else {
          let m = src[position++];
          let n = src[position++];
          if ((m & 128) > 0 || (n & 128) > 0) {
            position -= 14;
            return;
          }
          if (length < 15)
            return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l, m, n);
          let o = src[position++];
          if ((o & 128) > 0) {
            position -= 15;
            return;
          }
          return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
        }
      }
    }
  }
}
function readBin(length) {
  return currentDecoder.copyBuffers ? (
    // specifically use the copying slice (not the node one)
    Uint8Array.prototype.slice.call(src, position, position += length)
  ) : src.subarray(position, position += length);
}
var f32Array = new Float32Array(1);
var u8Array = new Uint8Array(f32Array.buffer, 0, 4);
function getFloat16() {
  let byte0 = src[position++];
  let byte1 = src[position++];
  let exponent = (byte0 & 127) >> 2;
  if (exponent === 31) {
    if (byte1 || byte0 & 3)
      return NaN;
    return byte0 & 128 ? -Infinity : Infinity;
  }
  if (exponent === 0) {
    let abs = ((byte0 & 3) << 8 | byte1) / (1 << 24);
    return byte0 & 128 ? -abs : abs;
  }
  u8Array[3] = byte0 & 128 | // sign bit
  (exponent >> 1) + 56;
  u8Array[2] = (byte0 & 7) << 5 | // last exponent bit and first two mantissa bits
  byte1 >> 3;
  u8Array[1] = byte1 << 5;
  u8Array[0] = 0;
  return f32Array[0];
}
var keyCache = new Array(4096);
var Tag = class {
  constructor(value, tag) {
    this.value = value;
    this.tag = tag;
  }
};
currentExtensions[0] = (dateString) => {
  return new Date(dateString);
};
currentExtensions[1] = (epochSec) => {
  return new Date(Math.round(epochSec * 1e3));
};
currentExtensions[2] = (buffer) => {
  let value = BigInt(0);
  for (let i = 0, l = buffer.byteLength; i < l; i++) {
    value = BigInt(buffer[i]) + (value << BigInt(8));
  }
  return value;
};
currentExtensions[3] = (buffer) => {
  return BigInt(-1) - currentExtensions[2](buffer);
};
currentExtensions[4] = (fraction) => {
  return +(fraction[1] + "e" + fraction[0]);
};
currentExtensions[5] = (fraction) => {
  return fraction[1] * Math.exp(fraction[0] * Math.log(2));
};
var recordDefinition = (id, structure) => {
  id = id - 57344;
  let existingStructure = currentStructures[id];
  if (existingStructure && existingStructure.isShared) {
    (currentStructures.restoreStructures || (currentStructures.restoreStructures = []))[id] = existingStructure;
  }
  currentStructures[id] = structure;
  structure.read = createStructureReader(structure);
};
currentExtensions[LEGACY_RECORD_INLINE_ID] = (data) => {
  let length = data.length;
  let structure = data[1];
  recordDefinition(data[0], structure);
  let object = {};
  for (let i = 2; i < length; i++) {
    let key = structure[i - 2];
    object[safeKey(key)] = data[i];
  }
  return object;
};
currentExtensions[14] = (value) => {
  if (bundledStrings)
    return bundledStrings[0].slice(bundledStrings.position0, bundledStrings.position0 += value);
  return new Tag(value, 14);
};
currentExtensions[15] = (value) => {
  if (bundledStrings)
    return bundledStrings[1].slice(bundledStrings.position1, bundledStrings.position1 += value);
  return new Tag(value, 15);
};
var glbl = { Error, RegExp };
currentExtensions[27] = (data) => {
  return (glbl[data[0]] || Error)(data[1], data[2]);
};
var packedTable = (read2) => {
  if (src[position++] != 132) {
    let error = new Error("Packed values structure must be followed by a 4 element array");
    if (src.length < position)
      error.incomplete = true;
    throw error;
  }
  let newPackedValues = read2();
  if (!newPackedValues || !newPackedValues.length) {
    let error = new Error("Packed values structure must be followed by a 4 element array");
    error.incomplete = true;
    throw error;
  }
  packedValues = packedValues ? newPackedValues.concat(packedValues.slice(newPackedValues.length)) : newPackedValues;
  packedValues.prefixes = read2();
  packedValues.suffixes = read2();
  return read2();
};
packedTable.handlesRead = true;
currentExtensions[51] = packedTable;
currentExtensions[PACKED_REFERENCE_TAG_ID] = (data) => {
  if (!packedValues) {
    if (currentDecoder.getShared)
      loadShared();
    else
      return new Tag(data, PACKED_REFERENCE_TAG_ID);
  }
  if (typeof data == "number")
    return packedValues[16 + (data >= 0 ? 2 * data : -2 * data - 1)];
  let error = new Error("No support for non-integer packed references yet");
  if (data === void 0)
    error.incomplete = true;
  throw error;
};
currentExtensions[28] = (read2) => {
  if (!referenceMap) {
    referenceMap = /* @__PURE__ */ new Map();
    referenceMap.id = 0;
  }
  let id = referenceMap.id++;
  let startingPosition = position;
  let token = src[position];
  let target2;
  if (token >> 5 == 4)
    target2 = [];
  else
    target2 = {};
  let refEntry = { target: target2 };
  referenceMap.set(id, refEntry);
  let targetProperties = read2();
  if (refEntry.used) {
    if (Object.getPrototypeOf(target2) !== Object.getPrototypeOf(targetProperties)) {
      position = startingPosition;
      target2 = targetProperties;
      referenceMap.set(id, { target: target2 });
      targetProperties = read2();
    }
    return Object.assign(target2, targetProperties);
  }
  refEntry.target = targetProperties;
  return targetProperties;
};
currentExtensions[28].handlesRead = true;
currentExtensions[29] = (id) => {
  let refEntry = referenceMap.get(id);
  refEntry.used = true;
  return refEntry.target;
};
currentExtensions[258] = (array) => new Set(array);
(currentExtensions[259] = (read2) => {
  if (currentDecoder.mapsAsObjects) {
    currentDecoder.mapsAsObjects = false;
    restoreMapsAsObject = true;
  }
  return read2();
}).handlesRead = true;
function combine(a, b) {
  if (typeof a === "string")
    return a + b;
  if (a instanceof Array)
    return a.concat(b);
  return Object.assign({}, a, b);
}
function getPackedValues() {
  if (!packedValues) {
    if (currentDecoder.getShared)
      loadShared();
    else
      throw new Error("No packed values available");
  }
  return packedValues;
}
var SHARED_DATA_TAG_ID = 1399353956;
currentExtensionRanges.push((tag, input) => {
  if (tag >= 225 && tag <= 255)
    return combine(getPackedValues().prefixes[tag - 224], input);
  if (tag >= 28704 && tag <= 32767)
    return combine(getPackedValues().prefixes[tag - 28672], input);
  if (tag >= 1879052288 && tag <= 2147483647)
    return combine(getPackedValues().prefixes[tag - 1879048192], input);
  if (tag >= 216 && tag <= 223)
    return combine(input, getPackedValues().suffixes[tag - 216]);
  if (tag >= 27647 && tag <= 28671)
    return combine(input, getPackedValues().suffixes[tag - 27639]);
  if (tag >= 1811940352 && tag <= 1879048191)
    return combine(input, getPackedValues().suffixes[tag - 1811939328]);
  if (tag == SHARED_DATA_TAG_ID) {
    return {
      packedValues,
      structures: currentStructures.slice(0),
      version: input
    };
  }
  if (tag == 55799)
    return input;
});
var isLittleEndianMachine = new Uint8Array(new Uint16Array([1]).buffer)[0] == 1;
var typedArrays = [
  Uint8Array,
  Uint8ClampedArray,
  Uint16Array,
  Uint32Array,
  typeof BigUint64Array == "undefined" ? { name: "BigUint64Array" } : BigUint64Array,
  Int8Array,
  Int16Array,
  Int32Array,
  typeof BigInt64Array == "undefined" ? { name: "BigInt64Array" } : BigInt64Array,
  Float32Array,
  Float64Array
];
var typedArrayTags = [64, 68, 69, 70, 71, 72, 77, 78, 79, 85, 86];
for (let i = 0; i < typedArrays.length; i++) {
  registerTypedArray(typedArrays[i], typedArrayTags[i]);
}
function registerTypedArray(TypedArray, tag) {
  let dvMethod = "get" + TypedArray.name.slice(0, -5);
  let bytesPerElement;
  if (typeof TypedArray === "function")
    bytesPerElement = TypedArray.BYTES_PER_ELEMENT;
  else
    TypedArray = null;
  for (let littleEndian = 0; littleEndian < 2; littleEndian++) {
    if (!littleEndian && bytesPerElement == 1)
      continue;
    let sizeShift = bytesPerElement == 2 ? 1 : bytesPerElement == 4 ? 2 : bytesPerElement == 8 ? 3 : 0;
    currentExtensions[littleEndian ? tag : tag - 4] = bytesPerElement == 1 || littleEndian == isLittleEndianMachine ? (buffer) => {
      if (!TypedArray)
        throw new Error("Could not find typed array for code " + tag);
      if (!currentDecoder.copyBuffers) {
        if (bytesPerElement === 1 || bytesPerElement === 2 && !(buffer.byteOffset & 1) || bytesPerElement === 4 && !(buffer.byteOffset & 3) || bytesPerElement === 8 && !(buffer.byteOffset & 7))
          return new TypedArray(buffer.buffer, buffer.byteOffset, buffer.byteLength >> sizeShift);
      }
      return new TypedArray(Uint8Array.prototype.slice.call(buffer, 0).buffer);
    } : (buffer) => {
      if (!TypedArray)
        throw new Error("Could not find typed array for code " + tag);
      let dv = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      let elements = buffer.length >> sizeShift;
      let ta = new TypedArray(elements);
      let method = dv[dvMethod];
      for (let i = 0; i < elements; i++) {
        ta[i] = method.call(dv, i << sizeShift, littleEndian);
      }
      return ta;
    };
  }
}
function readBundleExt() {
  let length = readJustLength();
  let bundlePosition = position + read();
  for (let i = 2; i < length; i++) {
    let bundleLength = readJustLength();
    position += bundleLength;
  }
  let dataPosition = position;
  position = bundlePosition;
  bundledStrings = [readStringJS(readJustLength()), readStringJS(readJustLength())];
  bundledStrings.position0 = 0;
  bundledStrings.position1 = 0;
  bundledStrings.postBundlePosition = position;
  position = dataPosition;
  return read();
}
function readJustLength() {
  if (!(position < srcEnd)) throw endOfCBORError();
  let token = src[position++] & 31;
  if (token > 23) {
    switch (token) {
      case 24:
        if (position >= srcEnd) throw endOfCBORError();
        token = src[position++];
        break;
      case 25:
        token = dataView.getUint16(position);
        position += 2;
        break;
      case 26:
        token = dataView.getUint32(position);
        position += 4;
        break;
    }
  }
  return token;
}
function loadShared() {
  if (currentDecoder.getShared) {
    let sharedData = saveState(() => {
      src = null;
      return currentDecoder.getShared();
    }) || {};
    let updatedStructures = sharedData.structures || [];
    currentDecoder.sharedVersion = sharedData.version;
    packedValues = currentDecoder.sharedValues = sharedData.packedValues;
    if (currentStructures === true)
      currentDecoder.structures = currentStructures = updatedStructures;
    else
      currentStructures.splice.apply(currentStructures, [0, updatedStructures.length].concat(updatedStructures));
  }
}
function saveState(callback) {
  let savedSrcEnd = srcEnd;
  let savedPosition = position;
  let savedStringPosition = stringPosition;
  let savedSrcStringStart = srcStringStart;
  let savedSrcStringEnd = srcStringEnd;
  let savedSrcString = srcString;
  let savedStrings = strings;
  let savedReferenceMap = referenceMap;
  let savedBundledStrings = bundledStrings;
  let savedSrc = new Uint8Array(src.slice(0, srcEnd));
  let savedStructures = currentStructures;
  let savedDecoder = currentDecoder;
  let savedSequentialMode = sequentialMode;
  let value = callback();
  srcEnd = savedSrcEnd;
  position = savedPosition;
  stringPosition = savedStringPosition;
  srcStringStart = savedSrcStringStart;
  srcStringEnd = savedSrcStringEnd;
  srcString = savedSrcString;
  strings = savedStrings;
  referenceMap = savedReferenceMap;
  bundledStrings = savedBundledStrings;
  src = savedSrc;
  sequentialMode = savedSequentialMode;
  currentStructures = savedStructures;
  currentDecoder = savedDecoder;
  dataView = new DataView(src.buffer, src.byteOffset, src.byteLength);
  return value;
}
function clearSource() {
  src = null;
  referenceMap = null;
  currentStructures = null;
}
var mult10 = new Array(147);
for (let i = 0; i < 256; i++) {
  mult10[i] = +("1e" + Math.floor(45.15 - i * 0.30103));
}
var defaultDecoder = new Decoder({ useRecords: false });
var decode = defaultDecoder.decode;
var decodeMultiple = defaultDecoder.decodeMultiple;
var FLOAT32_OPTIONS = {
  NEVER: 0,
  ALWAYS: 1,
  DECIMAL_ROUND: 3,
  DECIMAL_FIT: 4
};

// node_modules/cbor-x/encode.js
var textEncoder;
try {
  textEncoder = new TextEncoder();
} catch (error) {
}
var extensions;
var extensionClasses;
var Buffer2 = typeof globalThis === "object" && globalThis.Buffer;
var hasNodeBuffer = typeof Buffer2 !== "undefined";
var ByteArrayAllocate = hasNodeBuffer ? Buffer2.allocUnsafeSlow : Uint8Array;
var ByteArray = hasNodeBuffer ? Buffer2 : Uint8Array;
var MAX_STRUCTURES = 256;
var MAX_BUFFER_SIZE = hasNodeBuffer ? 4294967296 : 2144337920;
var throwOnIterable;
var target;
var targetView;
var position2 = 0;
var safeEnd;
var bundledStrings2 = null;
var MAX_BUNDLE_SIZE = 61440;
var hasNonLatin = /[\u0080-\uFFFF]/;
var RECORD_SYMBOL = Symbol("record-id");
var Encoder = class extends Decoder {
  constructor(options) {
    super(options);
    this.offset = 0;
    let typeBuffer;
    let start;
    let sharedStructures;
    let hasSharedUpdate;
    let structures;
    let referenceMap2;
    options = options || {};
    let encodeUtf8 = ByteArray.prototype.utf8Write ? function(string, position3) {
      return target.utf8Write(string, position3, target.byteLength - position3);
    } : textEncoder && textEncoder.encodeInto ? function(string, position3) {
      return textEncoder.encodeInto(string, target.subarray(position3)).written;
    } : false;
    let encoder = this;
    let hasSharedStructures = options.structures || options.saveStructures;
    let maxSharedStructures = options.maxSharedStructures;
    if (maxSharedStructures == null)
      maxSharedStructures = hasSharedStructures ? 128 : 0;
    if (maxSharedStructures > 8190)
      throw new Error("Maximum maxSharedStructure is 8190");
    let isSequential = options.sequential;
    if (isSequential) {
      maxSharedStructures = 0;
    }
    if (!this.structures)
      this.structures = [];
    if (this.saveStructures)
      this.saveShared = this.saveStructures;
    let samplingPackedValues, packedObjectMap2, sharedValues = options.sharedValues;
    let sharedPackedObjectMap2;
    if (sharedValues) {
      sharedPackedObjectMap2 = /* @__PURE__ */ Object.create(null);
      for (let i = 0, l = sharedValues.length; i < l; i++) {
        sharedPackedObjectMap2[sharedValues[i]] = i;
      }
    }
    let recordIdsToRemove = [];
    let transitionsCount = 0;
    let serializationsSinceTransitionRebuild = 0;
    this.mapEncode = function(value, encodeOptions) {
      if (this._keyMap && !this._mapped) {
        switch (value.constructor.name) {
          case "Array":
            value = value.map((r) => this.encodeKeys(r));
            break;
        }
      }
      return this.encode(value, encodeOptions);
    };
    this.encode = function(value, encodeOptions) {
      if (!target) {
        target = new ByteArrayAllocate(8192);
        targetView = new DataView(target.buffer, 0, 8192);
        position2 = 0;
      }
      safeEnd = target.length - 10;
      if (safeEnd - position2 < 2048) {
        target = new ByteArrayAllocate(target.length);
        targetView = new DataView(target.buffer, 0, target.length);
        safeEnd = target.length - 10;
        position2 = 0;
      } else if (encodeOptions === REUSE_BUFFER_MODE)
        position2 = position2 + 7 & 2147483640;
      start = position2;
      if (encoder.useSelfDescribedHeader) {
        targetView.setUint32(position2, 3654940416);
        position2 += 3;
      }
      referenceMap2 = encoder.structuredClone ? /* @__PURE__ */ new Map() : null;
      if (encoder.bundleStrings && typeof value !== "string") {
        bundledStrings2 = [];
        bundledStrings2.size = Infinity;
      } else
        bundledStrings2 = null;
      sharedStructures = encoder.structures;
      if (sharedStructures) {
        if (sharedStructures.uninitialized) {
          let sharedData = encoder.getShared() || {};
          encoder.structures = sharedStructures = sharedData.structures || [];
          encoder.sharedVersion = sharedData.version;
          let sharedValues2 = encoder.sharedValues = sharedData.packedValues;
          if (sharedValues2) {
            sharedPackedObjectMap2 = {};
            for (let i = 0, l = sharedValues2.length; i < l; i++)
              sharedPackedObjectMap2[sharedValues2[i]] = i;
          }
        }
        let sharedStructuresLength = sharedStructures.length;
        if (sharedStructuresLength > maxSharedStructures && !isSequential)
          sharedStructuresLength = maxSharedStructures;
        if (!sharedStructures.transitions) {
          sharedStructures.transitions = /* @__PURE__ */ Object.create(null);
          for (let i = 0; i < sharedStructuresLength; i++) {
            let keys = sharedStructures[i];
            if (!keys)
              continue;
            let nextTransition, transition = sharedStructures.transitions;
            for (let j = 0, l = keys.length; j < l; j++) {
              if (transition[RECORD_SYMBOL] === void 0)
                transition[RECORD_SYMBOL] = i;
              let key = keys[j];
              nextTransition = transition[key];
              if (!nextTransition) {
                nextTransition = transition[key] = /* @__PURE__ */ Object.create(null);
              }
              transition = nextTransition;
            }
            transition[RECORD_SYMBOL] = i | 1048576;
          }
        }
        if (!isSequential)
          sharedStructures.nextId = sharedStructuresLength;
      }
      if (hasSharedUpdate)
        hasSharedUpdate = false;
      structures = sharedStructures || [];
      packedObjectMap2 = sharedPackedObjectMap2;
      if (options.pack) {
        let packedValues2 = /* @__PURE__ */ new Map();
        packedValues2.values = [];
        packedValues2.encoder = encoder;
        packedValues2.maxValues = options.maxPrivatePackedValues || (sharedPackedObjectMap2 ? 16 : Infinity);
        packedValues2.objectMap = sharedPackedObjectMap2 || false;
        packedValues2.samplingPackedValues = samplingPackedValues;
        findRepetitiveStrings(value, packedValues2);
        if (packedValues2.values.length > 0) {
          target[position2++] = 216;
          target[position2++] = 51;
          writeArrayHeader(4);
          let valuesArray = packedValues2.values;
          encode2(valuesArray);
          writeArrayHeader(0);
          writeArrayHeader(0);
          packedObjectMap2 = Object.create(sharedPackedObjectMap2 || null);
          for (let i = 0, l = valuesArray.length; i < l; i++) {
            packedObjectMap2[valuesArray[i]] = i;
          }
        }
      }
      throwOnIterable = encodeOptions & THROW_ON_ITERABLE;
      try {
        if (throwOnIterable)
          return;
        encode2(value);
        if (bundledStrings2) {
          writeBundles(start, encode2);
        }
        encoder.offset = position2;
        if (referenceMap2 && referenceMap2.idsToInsert) {
          position2 += referenceMap2.idsToInsert.length * 2;
          if (position2 > safeEnd)
            makeRoom(position2);
          encoder.offset = position2;
          let serialized = insertIds(target.subarray(start, position2), referenceMap2.idsToInsert);
          referenceMap2 = null;
          return serialized;
        }
        if (encodeOptions & REUSE_BUFFER_MODE) {
          target.start = start;
          target.end = position2;
          return target;
        }
        return target.subarray(start, position2);
      } finally {
        if (sharedStructures) {
          if (serializationsSinceTransitionRebuild < 10)
            serializationsSinceTransitionRebuild++;
          if (sharedStructures.length > maxSharedStructures)
            sharedStructures.length = maxSharedStructures;
          if (transitionsCount > 1e4) {
            sharedStructures.transitions = null;
            serializationsSinceTransitionRebuild = 0;
            transitionsCount = 0;
            if (recordIdsToRemove.length > 0)
              recordIdsToRemove = [];
          } else if (recordIdsToRemove.length > 0 && !isSequential) {
            for (let i = 0, l = recordIdsToRemove.length; i < l; i++) {
              recordIdsToRemove[i][RECORD_SYMBOL] = void 0;
            }
            recordIdsToRemove = [];
          }
        }
        if (hasSharedUpdate && encoder.saveShared) {
          if (encoder.structures.length > maxSharedStructures) {
            encoder.structures = encoder.structures.slice(0, maxSharedStructures);
          }
          let returnBuffer = target.subarray(start, position2);
          if (encoder.updateSharedData() === false)
            return encoder.encode(value);
          return returnBuffer;
        }
        if (encodeOptions & RESET_BUFFER_MODE)
          position2 = start;
      }
    };
    this.findCommonStringsToPack = () => {
      samplingPackedValues = /* @__PURE__ */ new Map();
      if (!sharedPackedObjectMap2)
        sharedPackedObjectMap2 = /* @__PURE__ */ Object.create(null);
      return (options2) => {
        let threshold = options2 && options2.threshold || 4;
        let position3 = this.pack ? options2.maxPrivatePackedValues || 16 : 0;
        if (!sharedValues)
          sharedValues = this.sharedValues = [];
        for (let [key, status2] of samplingPackedValues) {
          if (status2.count > threshold) {
            sharedPackedObjectMap2[key] = position3++;
            sharedValues.push(key);
            hasSharedUpdate = true;
          }
        }
        while (this.saveShared && this.updateSharedData() === false) {
        }
        samplingPackedValues = null;
      };
    };
    const encode2 = (value) => {
      if (position2 > safeEnd)
        target = makeRoom(position2);
      var type = typeof value;
      var length;
      if (type === "string") {
        if (packedObjectMap2) {
          let packedPosition = packedObjectMap2[value];
          if (packedPosition >= 0) {
            if (packedPosition < 16)
              target[position2++] = packedPosition + 224;
            else {
              target[position2++] = 198;
              if (packedPosition & 1)
                encode2(15 - packedPosition >> 1);
              else
                encode2(packedPosition - 16 >> 1);
            }
            return;
          } else if (samplingPackedValues && !options.pack) {
            let status2 = samplingPackedValues.get(value);
            if (status2)
              status2.count++;
            else
              samplingPackedValues.set(value, {
                count: 1
              });
          }
        }
        let strLength = value.length;
        if (bundledStrings2 && strLength >= 4 && strLength < 1024) {
          if ((bundledStrings2.size += strLength) > MAX_BUNDLE_SIZE) {
            let extStart;
            let maxBytes2 = (bundledStrings2[0] ? bundledStrings2[0].length * 3 + bundledStrings2[1].length : 0) + 10;
            if (position2 + maxBytes2 > safeEnd)
              target = makeRoom(position2 + maxBytes2);
            target[position2++] = 217;
            target[position2++] = 223;
            target[position2++] = 249;
            target[position2++] = bundledStrings2.position ? 132 : 130;
            target[position2++] = 26;
            extStart = position2 - start;
            position2 += 4;
            if (bundledStrings2.position) {
              writeBundles(start, encode2);
            }
            bundledStrings2 = ["", ""];
            bundledStrings2.size = 0;
            bundledStrings2.position = extStart;
          }
          let twoByte = hasNonLatin.test(value);
          bundledStrings2[twoByte ? 0 : 1] += value;
          target[position2++] = twoByte ? 206 : 207;
          encode2(strLength);
          return;
        }
        let headerSize;
        if (strLength < 32) {
          headerSize = 1;
        } else if (strLength < 256) {
          headerSize = 2;
        } else if (strLength < 65536) {
          headerSize = 3;
        } else {
          headerSize = 5;
        }
        let maxBytes = strLength * 3;
        if (position2 + maxBytes > safeEnd)
          target = makeRoom(position2 + maxBytes);
        if (strLength < 64 || !encodeUtf8) {
          let i, c1, c2, strPosition = position2 + headerSize;
          for (i = 0; i < strLength; i++) {
            c1 = value.charCodeAt(i);
            if (c1 < 128) {
              target[strPosition++] = c1;
            } else if (c1 < 2048) {
              target[strPosition++] = c1 >> 6 | 192;
              target[strPosition++] = c1 & 63 | 128;
            } else if ((c1 & 64512) === 55296 && ((c2 = value.charCodeAt(i + 1)) & 64512) === 56320) {
              c1 = 65536 + ((c1 & 1023) << 10) + (c2 & 1023);
              i++;
              target[strPosition++] = c1 >> 18 | 240;
              target[strPosition++] = c1 >> 12 & 63 | 128;
              target[strPosition++] = c1 >> 6 & 63 | 128;
              target[strPosition++] = c1 & 63 | 128;
            } else {
              target[strPosition++] = c1 >> 12 | 224;
              target[strPosition++] = c1 >> 6 & 63 | 128;
              target[strPosition++] = c1 & 63 | 128;
            }
          }
          length = strPosition - position2 - headerSize;
        } else {
          length = encodeUtf8(value, position2 + headerSize, maxBytes);
        }
        if (length < 24) {
          target[position2++] = 96 | length;
        } else if (length < 256) {
          if (headerSize < 2) {
            target.copyWithin(position2 + 2, position2 + 1, position2 + 1 + length);
          }
          target[position2++] = 120;
          target[position2++] = length;
        } else if (length < 65536) {
          if (headerSize < 3) {
            target.copyWithin(position2 + 3, position2 + 2, position2 + 2 + length);
          }
          target[position2++] = 121;
          target[position2++] = length >> 8;
          target[position2++] = length & 255;
        } else {
          if (headerSize < 5) {
            target.copyWithin(position2 + 5, position2 + 3, position2 + 3 + length);
          }
          target[position2++] = 122;
          targetView.setUint32(position2, length);
          position2 += 4;
        }
        position2 += length;
      } else if (type === "number") {
        if (!this.alwaysUseFloat && value >>> 0 === value) {
          if (value < 24) {
            target[position2++] = value;
          } else if (value < 256) {
            target[position2++] = 24;
            target[position2++] = value;
          } else if (value < 65536) {
            target[position2++] = 25;
            target[position2++] = value >> 8;
            target[position2++] = value & 255;
          } else {
            target[position2++] = 26;
            targetView.setUint32(position2, value);
            position2 += 4;
          }
        } else if (!this.alwaysUseFloat && value >> 0 === value) {
          if (value >= -24) {
            target[position2++] = 31 - value;
          } else if (value >= -256) {
            target[position2++] = 56;
            target[position2++] = ~value;
          } else if (value >= -65536) {
            target[position2++] = 57;
            targetView.setUint16(position2, ~value);
            position2 += 2;
          } else {
            target[position2++] = 58;
            targetView.setUint32(position2, ~value);
            position2 += 4;
          }
        } else if (!this.alwaysUseFloat && value < 0 && value >= -4294967296 && Math.floor(value) === value) {
          target[position2++] = 58;
          targetView.setUint32(position2, -1 - value);
          position2 += 4;
        } else {
          let useFloat32;
          if ((useFloat32 = this.useFloat32) > 0 && value < 4294967296 && value >= -2147483648) {
            target[position2++] = 250;
            targetView.setFloat32(position2, value);
            let xShifted;
            if (useFloat32 < 4 || // this checks for rounding of numbers that were encoded in 32-bit float to nearest significant decimal digit that could be preserved
            (xShifted = value * mult10[(target[position2] & 127) << 1 | target[position2 + 1] >> 7]) >> 0 === xShifted) {
              position2 += 4;
              return;
            } else
              position2--;
          }
          target[position2++] = 251;
          targetView.setFloat64(position2, value);
          position2 += 8;
        }
      } else if (type === "object") {
        if (!value)
          target[position2++] = 246;
        else {
          if (referenceMap2) {
            let referee = referenceMap2.get(value);
            if (referee) {
              target[position2++] = 216;
              target[position2++] = 29;
              target[position2++] = 25;
              if (!referee.references) {
                let idsToInsert = referenceMap2.idsToInsert || (referenceMap2.idsToInsert = []);
                referee.references = [];
                idsToInsert.push(referee);
              }
              referee.references.push(position2 - start);
              position2 += 2;
              return;
            } else
              referenceMap2.set(value, { offset: position2 - start });
          }
          let constructor = value.constructor;
          if (constructor === Object) {
            if (this.skipFunction === true) {
              value = Object.fromEntries([...Object.keys(value).filter((x) => typeof value[x] !== "function").map((x) => [x, value[x]])]);
            }
            writeObject(value);
          } else if (constructor === Array) {
            length = value.length;
            if (length < 24) {
              target[position2++] = 128 | length;
            } else {
              writeArrayHeader(length);
            }
            for (let i = 0; i < length; i++) {
              encode2(value[i]);
            }
          } else if (constructor === Map) {
            if (this.mapsAsObjects ? this.useTag259ForMaps !== false : this.useTag259ForMaps) {
              target[position2++] = 217;
              target[position2++] = 1;
              target[position2++] = 3;
            }
            length = value.size;
            if (length < 24) {
              target[position2++] = 160 | length;
            } else if (length < 256) {
              target[position2++] = 184;
              target[position2++] = length;
            } else if (length < 65536) {
              target[position2++] = 185;
              target[position2++] = length >> 8;
              target[position2++] = length & 255;
            } else {
              target[position2++] = 186;
              targetView.setUint32(position2, length);
              position2 += 4;
            }
            if (encoder.keyMap) {
              for (let [key, entryValue] of value) {
                encode2(encoder.encodeKey(key));
                encode2(entryValue);
              }
            } else {
              for (let [key, entryValue] of value) {
                encode2(key);
                encode2(entryValue);
              }
            }
          } else {
            for (let i = 0, l = extensions.length; i < l; i++) {
              let extensionClass = extensionClasses[i];
              if (value instanceof extensionClass) {
                let extension = extensions[i];
                let tag = extension.tag;
                if (tag == void 0)
                  tag = extension.getTag && extension.getTag.call(this, value);
                if (tag < 24) {
                  target[position2++] = 192 | tag;
                } else if (tag < 256) {
                  target[position2++] = 216;
                  target[position2++] = tag;
                } else if (tag < 65536) {
                  target[position2++] = 217;
                  target[position2++] = tag >> 8;
                  target[position2++] = tag & 255;
                } else if (tag > -1) {
                  target[position2++] = 218;
                  targetView.setUint32(position2, tag);
                  position2 += 4;
                }
                extension.encode.call(this, value, encode2, makeRoom);
                return;
              }
            }
            if (value[Symbol.iterator]) {
              if (throwOnIterable) {
                let error = new Error("Iterable should be serialized as iterator");
                error.iteratorNotHandled = true;
                throw error;
              }
              target[position2++] = 159;
              for (let entry of value) {
                encode2(entry);
              }
              target[position2++] = 255;
              return;
            }
            if (value[Symbol.asyncIterator] || isBlob(value)) {
              let error = new Error("Iterable/blob should be serialized as iterator");
              error.iteratorNotHandled = true;
              throw error;
            }
            if (this.useToJSON && value.toJSON) {
              const json = value.toJSON();
              if (json !== value)
                return encode2(json);
            }
            writeObject(value);
          }
        }
      } else if (type === "boolean") {
        target[position2++] = value ? 245 : 244;
      } else if (type === "bigint") {
        if (value < BigInt(1) << BigInt(64) && value >= 0) {
          target[position2++] = 27;
          targetView.setBigUint64(position2, value);
        } else if (value > -(BigInt(1) << BigInt(64)) && value < 0) {
          target[position2++] = 59;
          targetView.setBigUint64(position2, -value - BigInt(1));
        } else {
          if (this.largeBigIntToFloat) {
            target[position2++] = 251;
            targetView.setFloat64(position2, Number(value));
          } else {
            if (value >= BigInt(0))
              target[position2++] = 194;
            else {
              target[position2++] = 195;
              value = BigInt(-1) - value;
            }
            let bytes = [];
            while (value) {
              bytes.push(Number(value & BigInt(255)));
              value >>= BigInt(8);
            }
            writeBuffer(new Uint8Array(bytes.reverse()), makeRoom);
            return;
          }
        }
        position2 += 8;
      } else if (type === "undefined") {
        target[position2++] = 247;
      } else {
        throw new Error("Unknown type: " + type);
      }
    };
    const writeObject = this.useRecords === false ? this.variableMapSize ? (object) => {
      let keys = Object.keys(object);
      let vals = Object.values(object);
      let length = keys.length;
      if (length < 24) {
        target[position2++] = 160 | length;
      } else if (length < 256) {
        target[position2++] = 184;
        target[position2++] = length;
      } else if (length < 65536) {
        target[position2++] = 185;
        target[position2++] = length >> 8;
        target[position2++] = length & 255;
      } else {
        target[position2++] = 186;
        targetView.setUint32(position2, length);
        position2 += 4;
      }
      let key;
      if (encoder.keyMap) {
        for (let i = 0; i < length; i++) {
          encode2(encoder.encodeKey(keys[i]));
          encode2(vals[i]);
        }
      } else {
        for (let i = 0; i < length; i++) {
          encode2(keys[i]);
          encode2(vals[i]);
        }
      }
    } : (object) => {
      target[position2++] = 185;
      let objectOffset = position2 - start;
      position2 += 2;
      let size = 0;
      if (encoder.keyMap) {
        for (let key in object) if (typeof object.hasOwnProperty !== "function" || object.hasOwnProperty(key)) {
          encode2(encoder.encodeKey(key));
          encode2(object[key]);
          size++;
        }
      } else {
        for (let key in object) if (typeof object.hasOwnProperty !== "function" || object.hasOwnProperty(key)) {
          encode2(key);
          encode2(object[key]);
          size++;
        }
      }
      target[objectOffset++ + start] = size >> 8;
      target[objectOffset + start] = size & 255;
    } : (object, skipValues) => {
      let nextTransition, transition = structures.transitions || (structures.transitions = /* @__PURE__ */ Object.create(null));
      let newTransitions = 0;
      let length = 0;
      let parentRecordId;
      let keys;
      if (this.keyMap) {
        keys = Object.keys(object).map((k) => this.encodeKey(k));
        length = keys.length;
        for (let i = 0; i < length; i++) {
          let key = keys[i];
          nextTransition = transition[key];
          if (!nextTransition) {
            nextTransition = transition[key] = /* @__PURE__ */ Object.create(null);
            newTransitions++;
          }
          transition = nextTransition;
        }
      } else {
        for (let key in object) if (typeof object.hasOwnProperty !== "function" || object.hasOwnProperty(key)) {
          nextTransition = transition[key];
          if (!nextTransition) {
            if (transition[RECORD_SYMBOL] & 1048576) {
              parentRecordId = transition[RECORD_SYMBOL] & 65535;
            }
            nextTransition = transition[key] = /* @__PURE__ */ Object.create(null);
            newTransitions++;
          }
          transition = nextTransition;
          length++;
        }
      }
      let recordId = transition[RECORD_SYMBOL];
      if (recordId !== void 0) {
        recordId &= 65535;
        target[position2++] = 217;
        target[position2++] = recordId >> 8 | 224;
        target[position2++] = recordId & 255;
      } else {
        if (!keys)
          keys = transition.__keys__ || (transition.__keys__ = Object.keys(object));
        if (parentRecordId === void 0) {
          recordId = structures.nextId++;
          if (!recordId) {
            recordId = 0;
            structures.nextId = 1;
          }
          if (recordId >= MAX_STRUCTURES) {
            structures.nextId = (recordId = maxSharedStructures) + 1;
          }
        } else {
          recordId = parentRecordId;
        }
        structures[recordId] = keys;
        if (recordId < maxSharedStructures) {
          target[position2++] = 217;
          target[position2++] = recordId >> 8 | 224;
          target[position2++] = recordId & 255;
          transition = structures.transitions;
          for (let i = 0; i < length; i++) {
            if (transition[RECORD_SYMBOL] === void 0 || transition[RECORD_SYMBOL] & 1048576)
              transition[RECORD_SYMBOL] = recordId;
            transition = transition[keys[i]];
          }
          transition[RECORD_SYMBOL] = recordId | 1048576;
          hasSharedUpdate = true;
        } else {
          transition[RECORD_SYMBOL] = recordId;
          targetView.setUint32(position2, 3655335680);
          position2 += 3;
          if (newTransitions)
            transitionsCount += serializationsSinceTransitionRebuild * newTransitions;
          if (recordIdsToRemove.length >= MAX_STRUCTURES - maxSharedStructures)
            recordIdsToRemove.shift()[RECORD_SYMBOL] = void 0;
          recordIdsToRemove.push(transition);
          writeArrayHeader(length + 2);
          encode2(57344 + recordId);
          encode2(keys);
          if (skipValues) return;
          for (let key in object)
            if (typeof object.hasOwnProperty !== "function" || object.hasOwnProperty(key))
              encode2(object[key]);
          return;
        }
      }
      if (length < 24) {
        target[position2++] = 128 | length;
      } else {
        writeArrayHeader(length);
      }
      if (skipValues) return;
      for (let key in object)
        if (typeof object.hasOwnProperty !== "function" || object.hasOwnProperty(key))
          encode2(object[key]);
    };
    const makeRoom = (end) => {
      let newSize;
      if (end > 16777216) {
        if (end - start > MAX_BUFFER_SIZE)
          throw new Error("Encoded buffer would be larger than maximum buffer size");
        newSize = Math.min(
          MAX_BUFFER_SIZE,
          Math.round(Math.max((end - start) * (end > 67108864 ? 1.25 : 2), 4194304) / 4096) * 4096
        );
      } else
        newSize = (Math.max(end - start << 2, target.length - 1) >> 12) + 1 << 12;
      let newBuffer = new ByteArrayAllocate(newSize);
      targetView = new DataView(newBuffer.buffer, 0, newSize);
      if (target.copy)
        target.copy(newBuffer, 0, start, end);
      else
        newBuffer.set(target.slice(start, end));
      position2 -= start;
      start = 0;
      safeEnd = newBuffer.length - 10;
      return target = newBuffer;
    };
    let chunkThreshold = 100;
    let continuedChunkThreshold = 1e3;
    this.encodeAsIterable = function(value, options2) {
      return startEncoding(value, options2, encodeObjectAsIterable);
    };
    this.encodeAsAsyncIterable = function(value, options2) {
      return startEncoding(value, options2, encodeObjectAsAsyncIterable);
    };
    function* encodeObjectAsIterable(object, iterateProperties, finalIterable) {
      let constructor = object.constructor;
      if (constructor === Object) {
        let useRecords = encoder.useRecords !== false;
        if (useRecords)
          writeObject(object, true);
        else
          writeEntityLength(Object.keys(object).length, 160);
        for (let key in object) {
          let value = object[key];
          if (!useRecords) encode2(key);
          if (value && typeof value === "object") {
            if (iterateProperties[key])
              yield* encodeObjectAsIterable(value, iterateProperties[key]);
            else
              yield* tryEncode(value, iterateProperties, key);
          } else encode2(value);
        }
      } else if (constructor === Array) {
        let length = object.length;
        writeArrayHeader(length);
        for (let i = 0; i < length; i++) {
          let value = object[i];
          if (value && (typeof value === "object" || position2 - start > chunkThreshold)) {
            if (iterateProperties.element)
              yield* encodeObjectAsIterable(value, iterateProperties.element);
            else
              yield* tryEncode(value, iterateProperties, "element");
          } else encode2(value);
        }
      } else if (object[Symbol.iterator] && !object.buffer) {
        target[position2++] = 159;
        for (let value of object) {
          if (value && (typeof value === "object" || position2 - start > chunkThreshold)) {
            if (iterateProperties.element)
              yield* encodeObjectAsIterable(value, iterateProperties.element);
            else
              yield* tryEncode(value, iterateProperties, "element");
          } else encode2(value);
        }
        target[position2++] = 255;
      } else if (isBlob(object)) {
        writeEntityLength(object.size, 64);
        yield target.subarray(start, position2);
        yield object;
        restartEncoding();
      } else if (object[Symbol.asyncIterator]) {
        target[position2++] = 159;
        yield target.subarray(start, position2);
        yield object;
        restartEncoding();
        target[position2++] = 255;
      } else {
        encode2(object);
      }
      if (finalIterable && position2 > start) yield target.subarray(start, position2);
      else if (position2 - start > chunkThreshold) {
        yield target.subarray(start, position2);
        restartEncoding();
      }
    }
    function* tryEncode(value, iterateProperties, key) {
      let restart = position2 - start;
      try {
        encode2(value);
        if (position2 - start > chunkThreshold) {
          yield target.subarray(start, position2);
          restartEncoding();
        }
      } catch (error) {
        if (error.iteratorNotHandled) {
          iterateProperties[key] = {};
          position2 = start + restart;
          yield* encodeObjectAsIterable.call(this, value, iterateProperties[key]);
        } else throw error;
      }
    }
    function restartEncoding() {
      chunkThreshold = continuedChunkThreshold;
      encoder.encode(null, THROW_ON_ITERABLE);
    }
    function startEncoding(value, options2, encodeIterable) {
      if (options2 && options2.chunkThreshold)
        chunkThreshold = continuedChunkThreshold = options2.chunkThreshold;
      else
        chunkThreshold = 100;
      if (value && typeof value === "object") {
        encoder.encode(null, THROW_ON_ITERABLE);
        return encodeIterable(value, encoder.iterateProperties || (encoder.iterateProperties = {}), true);
      }
      return [encoder.encode(value)];
    }
    async function* encodeObjectAsAsyncIterable(value, iterateProperties) {
      for (let encodedValue of encodeObjectAsIterable(value, iterateProperties, true)) {
        let constructor = encodedValue.constructor;
        if (constructor === ByteArray || constructor === Uint8Array)
          yield encodedValue;
        else if (isBlob(encodedValue)) {
          let reader = encodedValue.stream().getReader();
          let next;
          while (!(next = await reader.read()).done) {
            yield next.value;
          }
        } else if (encodedValue[Symbol.asyncIterator]) {
          for await (let asyncValue of encodedValue) {
            restartEncoding();
            if (asyncValue)
              yield* encodeObjectAsAsyncIterable(asyncValue, iterateProperties.async || (iterateProperties.async = {}));
            else yield encoder.encode(asyncValue);
          }
        } else {
          yield encodedValue;
        }
      }
    }
  }
  useBuffer(buffer) {
    target = buffer;
    targetView = new DataView(target.buffer, target.byteOffset, target.byteLength);
    position2 = 0;
  }
  clearSharedData() {
    if (this.structures)
      this.structures = [];
    if (this.sharedValues)
      this.sharedValues = void 0;
  }
  updateSharedData() {
    let lastVersion = this.sharedVersion || 0;
    this.sharedVersion = lastVersion + 1;
    let structuresCopy = this.structures.slice(0);
    let sharedData = new SharedData(structuresCopy, this.sharedValues, this.sharedVersion);
    let saveResults = this.saveShared(
      sharedData,
      (existingShared) => (existingShared && existingShared.version || 0) == lastVersion
    );
    if (saveResults === false) {
      sharedData = this.getShared() || {};
      this.structures = sharedData.structures || [];
      this.sharedValues = sharedData.packedValues;
      this.sharedVersion = sharedData.version;
      this.structures.nextId = this.structures.length;
    } else {
      structuresCopy.forEach((structure, i) => this.structures[i] = structure);
    }
    return saveResults;
  }
};
function writeEntityLength(length, majorValue) {
  if (length < 24)
    target[position2++] = majorValue | length;
  else if (length < 256) {
    target[position2++] = majorValue | 24;
    target[position2++] = length;
  } else if (length < 65536) {
    target[position2++] = majorValue | 25;
    target[position2++] = length >> 8;
    target[position2++] = length & 255;
  } else {
    target[position2++] = majorValue | 26;
    targetView.setUint32(position2, length);
    position2 += 4;
  }
}
var SharedData = class {
  constructor(structures, values, version) {
    this.structures = structures;
    this.packedValues = values;
    this.version = version;
  }
};
function writeArrayHeader(length) {
  if (length < 24)
    target[position2++] = 128 | length;
  else if (length < 256) {
    target[position2++] = 152;
    target[position2++] = length;
  } else if (length < 65536) {
    target[position2++] = 153;
    target[position2++] = length >> 8;
    target[position2++] = length & 255;
  } else {
    target[position2++] = 154;
    targetView.setUint32(position2, length);
    position2 += 4;
  }
}
var BlobConstructor = typeof Blob === "undefined" ? function() {
} : Blob;
function isBlob(object) {
  if (object instanceof BlobConstructor)
    return true;
  let tag = object[Symbol.toStringTag];
  return tag === "Blob" || tag === "File";
}
function findRepetitiveStrings(value, packedValues2) {
  switch (typeof value) {
    case "string":
      if (value.length > 3) {
        if (packedValues2.objectMap[value] > -1 || packedValues2.values.length >= packedValues2.maxValues)
          return;
        let packedStatus = packedValues2.get(value);
        if (packedStatus) {
          if (++packedStatus.count == 2) {
            packedValues2.values.push(value);
          }
        } else {
          packedValues2.set(value, {
            count: 1
          });
          if (packedValues2.samplingPackedValues) {
            let status2 = packedValues2.samplingPackedValues.get(value);
            if (status2)
              status2.count++;
            else
              packedValues2.samplingPackedValues.set(value, {
                count: 1
              });
          }
        }
      }
      break;
    case "object":
      if (value) {
        if (value instanceof Array) {
          for (let i = 0, l = value.length; i < l; i++) {
            findRepetitiveStrings(value[i], packedValues2);
          }
        } else {
          let includeKeys = !packedValues2.encoder.useRecords;
          for (var key in value) {
            if (value.hasOwnProperty(key)) {
              if (includeKeys)
                findRepetitiveStrings(key, packedValues2);
              findRepetitiveStrings(value[key], packedValues2);
            }
          }
        }
      }
      break;
    case "function":
      console.log(value);
  }
}
var isLittleEndianMachine2 = new Uint8Array(new Uint16Array([1]).buffer)[0] == 1;
extensionClasses = [
  Date,
  Set,
  Error,
  RegExp,
  Tag,
  ArrayBuffer,
  Uint8Array,
  Uint8ClampedArray,
  Uint16Array,
  Uint32Array,
  typeof BigUint64Array == "undefined" ? function() {
  } : BigUint64Array,
  Int8Array,
  Int16Array,
  Int32Array,
  typeof BigInt64Array == "undefined" ? function() {
  } : BigInt64Array,
  Float32Array,
  Float64Array,
  SharedData
];
extensions = [
  {
    // Date
    tag: 1,
    encode(date, encode2) {
      let seconds = date.getTime() / 1e3;
      if ((this.useTimestamp32 || date.getMilliseconds() === 0) && seconds >= 0 && seconds < 4294967296) {
        target[position2++] = 26;
        targetView.setUint32(position2, seconds);
        position2 += 4;
      } else {
        target[position2++] = 251;
        targetView.setFloat64(position2, seconds);
        position2 += 8;
      }
    }
  },
  {
    // Set
    tag: 258,
    // https://github.com/input-output-hk/cbor-sets-spec/blob/master/CBOR_SETS.md
    encode(set2, encode2) {
      let array = Array.from(set2);
      encode2(array);
    }
  },
  {
    // Error
    tag: 27,
    // http://cbor.schmorp.de/generic-object
    encode(error, encode2) {
      encode2([error.name, error.message]);
    }
  },
  {
    // RegExp
    tag: 27,
    // http://cbor.schmorp.de/generic-object
    encode(regex, encode2) {
      encode2(["RegExp", regex.source, regex.flags]);
    }
  },
  {
    // Tag
    getTag(tag) {
      return tag.tag;
    },
    encode(tag, encode2) {
      encode2(tag.value);
    }
  },
  {
    // ArrayBuffer
    encode(arrayBuffer, encode2, makeRoom) {
      writeBuffer(arrayBuffer, makeRoom);
    }
  },
  {
    // Uint8Array
    getTag(typedArray) {
      if (typedArray.constructor === Uint8Array) {
        if (this.tagUint8Array || hasNodeBuffer && this.tagUint8Array !== false)
          return 64;
      }
    },
    encode(typedArray, encode2, makeRoom) {
      writeBuffer(typedArray, makeRoom);
    }
  },
  typedArrayEncoder(68, 1),
  typedArrayEncoder(69, 2),
  typedArrayEncoder(70, 4),
  typedArrayEncoder(71, 8),
  typedArrayEncoder(72, 1),
  typedArrayEncoder(77, 2),
  typedArrayEncoder(78, 4),
  typedArrayEncoder(79, 8),
  typedArrayEncoder(85, 4),
  typedArrayEncoder(86, 8),
  {
    encode(sharedData, encode2) {
      let packedValues2 = sharedData.packedValues || [];
      let sharedStructures = sharedData.structures || [];
      if (packedValues2.values.length > 0) {
        target[position2++] = 216;
        target[position2++] = 51;
        writeArrayHeader(4);
        let valuesArray = packedValues2.values;
        encode2(valuesArray);
        writeArrayHeader(0);
        writeArrayHeader(0);
        packedObjectMap = Object.create(sharedPackedObjectMap || null);
        for (let i = 0, l = valuesArray.length; i < l; i++) {
          packedObjectMap[valuesArray[i]] = i;
        }
      }
      if (sharedStructures) {
        targetView.setUint32(position2, 3655335424);
        position2 += 3;
        let definitions = sharedStructures.slice(0);
        definitions.unshift(57344);
        definitions.push(new Tag(sharedData.version, 1399353956));
        encode2(definitions);
      } else
        encode2(new Tag(sharedData.version, 1399353956));
    }
  }
];
function typedArrayEncoder(tag, size) {
  if (!isLittleEndianMachine2 && size > 1)
    tag -= 4;
  return {
    tag,
    encode: function writeExtBuffer(typedArray, encode2) {
      let length = typedArray.byteLength;
      let offset = typedArray.byteOffset || 0;
      let buffer = typedArray.buffer || typedArray;
      encode2(hasNodeBuffer ? Buffer2.from(buffer, offset, length) : new Uint8Array(buffer, offset, length));
    }
  };
}
function writeBuffer(buffer, makeRoom) {
  let length = buffer.byteLength;
  if (length < 24) {
    target[position2++] = 64 + length;
  } else if (length < 256) {
    target[position2++] = 88;
    target[position2++] = length;
  } else if (length < 65536) {
    target[position2++] = 89;
    target[position2++] = length >> 8;
    target[position2++] = length & 255;
  } else {
    target[position2++] = 90;
    targetView.setUint32(position2, length);
    position2 += 4;
  }
  if (position2 + length >= target.length) {
    makeRoom(position2 + length);
  }
  target.set(buffer.buffer ? buffer : new Uint8Array(buffer), position2);
  position2 += length;
}
function insertIds(serialized, idsToInsert) {
  let nextId;
  let distanceToMove = idsToInsert.length * 2;
  let lastEnd = serialized.length - distanceToMove;
  idsToInsert.sort((a, b) => a.offset > b.offset ? 1 : -1);
  for (let id = 0; id < idsToInsert.length; id++) {
    let referee = idsToInsert[id];
    referee.id = id;
    for (let position3 of referee.references) {
      serialized[position3++] = id >> 8;
      serialized[position3] = id & 255;
    }
  }
  while (nextId = idsToInsert.pop()) {
    let offset = nextId.offset;
    serialized.copyWithin(offset + distanceToMove, offset, lastEnd);
    distanceToMove -= 2;
    let position3 = offset + distanceToMove;
    serialized[position3++] = 216;
    serialized[position3++] = 28;
    lastEnd = offset;
  }
  return serialized;
}
function writeBundles(start, encode2) {
  targetView.setUint32(bundledStrings2.position + start, position2 - bundledStrings2.position - start + 1);
  let writeStrings = bundledStrings2;
  bundledStrings2 = null;
  encode2(writeStrings[0]);
  encode2(writeStrings[1]);
}
var defaultEncoder = new Encoder({ useRecords: false });
var encode = defaultEncoder.encode;
var encodeAsIterable = defaultEncoder.encodeAsIterable;
var encodeAsAsyncIterable = defaultEncoder.encodeAsAsyncIterable;
var { NEVER, ALWAYS, DECIMAL_ROUND, DECIMAL_FIT } = FLOAT32_OPTIONS;
var REUSE_BUFFER_MODE = 512;
var RESET_BUFFER_MODE = 1024;
var THROW_ON_ITERABLE = 2048;

// node_modules/fflate/esm/browser.js
var u8 = Uint8Array;
var u16 = Uint16Array;
var i32 = Int32Array;
var fleb = new u8([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]);
var fdeb = new u8([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]);
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var freb = function(eb, start) {
  var b = new u16(31);
  for (var i = 0; i < 31; ++i) {
    b[i] = start += 1 << eb[i - 1];
  }
  var r = new i32(b[30]);
  for (var i = 1; i < 30; ++i) {
    for (var j = b[i]; j < b[i + 1]; ++j) {
      r[j] = j - b[i] << 5 | i;
    }
  }
  return { b, r };
};
var _a = freb(fleb, 2);
var fl = _a.b;
var revfl = _a.r;
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0);
var fd = _b.b;
var revfd = _b.r;
var rev = new u16(32768);
for (i = 0; i < 32768; ++i) {
  x = (i & 43690) >> 1 | (i & 21845) << 1;
  x = (x & 52428) >> 2 | (x & 13107) << 2;
  x = (x & 61680) >> 4 | (x & 3855) << 4;
  rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
}
var x;
var i;
var hMap = (function(cd, mb, r) {
  var s = cd.length;
  var i = 0;
  var l = new u16(mb);
  for (; i < s; ++i) {
    if (cd[i])
      ++l[cd[i] - 1];
  }
  var le = new u16(mb);
  for (i = 1; i < mb; ++i) {
    le[i] = le[i - 1] + l[i - 1] << 1;
  }
  var co;
  if (r) {
    co = new u16(1 << mb);
    var rvb = 15 - mb;
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        var sv = i << 4 | cd[i];
        var r_1 = mb - cd[i];
        var v = le[cd[i] - 1]++ << r_1;
        for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
          co[rev[v] >> rvb] = sv;
        }
      }
    }
  } else {
    co = new u16(s);
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        co[i] = rev[le[cd[i] - 1]++] >> 15 - cd[i];
      }
    }
  }
  return co;
});
var flt = new u8(288);
for (i = 0; i < 144; ++i)
  flt[i] = 8;
var i;
for (i = 144; i < 256; ++i)
  flt[i] = 9;
var i;
for (i = 256; i < 280; ++i)
  flt[i] = 7;
var i;
for (i = 280; i < 288; ++i)
  flt[i] = 8;
var i;
var fdt = new u8(32);
for (i = 0; i < 32; ++i)
  fdt[i] = 5;
var i;
var flm = /* @__PURE__ */ hMap(flt, 9, 0);
var flrm = /* @__PURE__ */ hMap(flt, 9, 1);
var fdm = /* @__PURE__ */ hMap(fdt, 5, 0);
var fdrm = /* @__PURE__ */ hMap(fdt, 5, 1);
var max = function(a) {
  var m = a[0];
  for (var i = 1; i < a.length; ++i) {
    if (a[i] > m)
      m = a[i];
  }
  return m;
};
var bits = function(d, p, m) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8) >> (p & 7) & m;
};
var bits16 = function(d, p) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8 | d[o + 2] << 16) >> (p & 7);
};
var shft = function(p) {
  return (p + 7) / 8 | 0;
};
var slc = function(v, s, e) {
  if (s == null || s < 0)
    s = 0;
  if (e == null || e > v.length)
    e = v.length;
  return new u8(v.subarray(s, e));
};
var ec = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  // determined by compression function
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
  // determined by unknown compression method
];
var err = function(ind, msg, nt) {
  var e = new Error(msg || ec[ind]);
  e.code = ind;
  if (Error.captureStackTrace)
    Error.captureStackTrace(e, err);
  if (!nt)
    throw e;
  return e;
};
var inflt = function(dat, st, buf, dict) {
  var sl = dat.length, dl = dict ? dict.length : 0;
  if (!sl || st.f && !st.l)
    return buf || new u8(0);
  var noBuf = !buf;
  var resize = noBuf || st.i != 2;
  var noSt = st.i;
  if (noBuf)
    buf = new u8(sl * 3);
  var cbuf = function(l2) {
    var bl = buf.length;
    if (l2 > bl) {
      var nbuf = new u8(Math.max(bl * 2, l2));
      nbuf.set(buf);
      buf = nbuf;
    }
  };
  var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
  var tbts = sl * 8;
  do {
    if (!lm) {
      final = bits(dat, pos, 1);
      var type = bits(dat, pos + 1, 3);
      pos += 3;
      if (!type) {
        var s = shft(pos) + 4, l = dat[s - 4] | dat[s - 3] << 8, t = s + l;
        if (t > sl) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + l);
        buf.set(dat.subarray(s, t), bt);
        st.b = bt += l, st.p = pos = t * 8, st.f = final;
        continue;
      } else if (type == 1)
        lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
      else if (type == 2) {
        var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
        var tl = hLit + bits(dat, pos + 5, 31) + 1;
        pos += 14;
        var ldt = new u8(tl);
        var clt = new u8(19);
        for (var i = 0; i < hcLen; ++i) {
          clt[clim[i]] = bits(dat, pos + i * 3, 7);
        }
        pos += hcLen * 3;
        var clb = max(clt), clbmsk = (1 << clb) - 1;
        var clm = hMap(clt, clb, 1);
        for (var i = 0; i < tl; ) {
          var r = clm[bits(dat, pos, clbmsk)];
          pos += r & 15;
          var s = r >> 4;
          if (s < 16) {
            ldt[i++] = s;
          } else {
            var c = 0, n = 0;
            if (s == 16)
              n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];
            else if (s == 17)
              n = 3 + bits(dat, pos, 7), pos += 3;
            else if (s == 18)
              n = 11 + bits(dat, pos, 127), pos += 7;
            while (n--)
              ldt[i++] = c;
          }
        }
        var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
        lbt = max(lt);
        dbt = max(dt);
        lm = hMap(lt, lbt, 1);
        dm = hMap(dt, dbt, 1);
      } else
        err(1);
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
    }
    if (resize)
      cbuf(bt + 131072);
    var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
    var lpos = pos;
    for (; ; lpos = pos) {
      var c = lm[bits16(dat, pos) & lms], sym = c >> 4;
      pos += c & 15;
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
      if (!c)
        err(2);
      if (sym < 256)
        buf[bt++] = sym;
      else if (sym == 256) {
        lpos = pos, lm = null;
        break;
      } else {
        var add = sym - 254;
        if (sym > 264) {
          var i = sym - 257, b = fleb[i];
          add = bits(dat, pos, (1 << b) - 1) + fl[i];
          pos += b;
        }
        var d = dm[bits16(dat, pos) & dms], dsym = d >> 4;
        if (!d)
          err(3);
        pos += d & 15;
        var dt = fd[dsym];
        if (dsym > 3) {
          var b = fdeb[dsym];
          dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
        }
        if (pos > tbts) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + 131072);
        var end = bt + add;
        if (bt < dt) {
          var shift = dl - dt, dend = Math.min(dt, end);
          if (shift + bt < 0)
            err(3);
          for (; bt < dend; ++bt)
            buf[bt] = dict[shift + bt];
        }
        for (; bt < end; ++bt)
          buf[bt] = buf[bt - dt];
      }
    }
    st.l = lm, st.p = lpos, st.b = bt, st.f = final;
    if (lm)
      final = 1, st.m = lbt, st.d = dm, st.n = dbt;
  } while (!final);
  return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
};
var wbits = function(d, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v;
  d[o + 1] |= v >> 8;
};
var wbits16 = function(d, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v;
  d[o + 1] |= v >> 8;
  d[o + 2] |= v >> 16;
};
var hTree = function(d, mb) {
  var t = [];
  for (var i = 0; i < d.length; ++i) {
    if (d[i])
      t.push({ s: i, f: d[i] });
  }
  var s = t.length;
  var t2 = t.slice();
  if (!s)
    return { t: et, l: 0 };
  if (s == 1) {
    var v = new u8(t[0].s + 1);
    v[t[0].s] = 1;
    return { t: v, l: 1 };
  }
  t.sort(function(a, b) {
    return a.f - b.f;
  });
  t.push({ s: -1, f: 25001 });
  var l = t[0], r = t[1], i0 = 0, i1 = 1, i2 = 2;
  t[0] = { s: -1, f: l.f + r.f, l, r };
  while (i1 != s - 1) {
    l = t[t[i0].f < t[i2].f ? i0++ : i2++];
    r = t[i0 != i1 && t[i0].f < t[i2].f ? i0++ : i2++];
    t[i1++] = { s: -1, f: l.f + r.f, l, r };
  }
  var maxSym = t2[0].s;
  for (var i = 1; i < s; ++i) {
    if (t2[i].s > maxSym)
      maxSym = t2[i].s;
  }
  var tr = new u16(maxSym + 1);
  var mbt = ln(t[i1 - 1], tr, 0);
  if (mbt > mb) {
    var i = 0, dt = 0;
    var lft = mbt - mb, cst = 1 << lft;
    t2.sort(function(a, b) {
      return tr[b.s] - tr[a.s] || a.f - b.f;
    });
    for (; i < s; ++i) {
      var i2_1 = t2[i].s;
      if (tr[i2_1] > mb) {
        dt += cst - (1 << mbt - tr[i2_1]);
        tr[i2_1] = mb;
      } else
        break;
    }
    dt >>= lft;
    while (dt > 0) {
      var i2_2 = t2[i].s;
      if (tr[i2_2] < mb)
        dt -= 1 << mb - tr[i2_2]++ - 1;
      else
        ++i;
    }
    for (; i >= 0 && dt; --i) {
      var i2_3 = t2[i].s;
      if (tr[i2_3] == mb) {
        --tr[i2_3];
        ++dt;
      }
    }
    mbt = mb;
  }
  return { t: new u8(tr), l: mbt };
};
var ln = function(n, l, d) {
  return n.s == -1 ? Math.max(ln(n.l, l, d + 1), ln(n.r, l, d + 1)) : l[n.s] = d;
};
var lc = function(c) {
  var s = c.length;
  while (s && !c[--s])
    ;
  var cl = new u16(++s);
  var cli = 0, cln = c[0], cls = 1;
  var w = function(v) {
    cl[cli++] = v;
  };
  for (var i = 1; i <= s; ++i) {
    if (c[i] == cln && i != s)
      ++cls;
    else {
      if (!cln && cls > 2) {
        for (; cls > 138; cls -= 138)
          w(32754);
        if (cls > 2) {
          w(cls > 10 ? cls - 11 << 5 | 28690 : cls - 3 << 5 | 12305);
          cls = 0;
        }
      } else if (cls > 3) {
        w(cln), --cls;
        for (; cls > 6; cls -= 6)
          w(8304);
        if (cls > 2)
          w(cls - 3 << 5 | 8208), cls = 0;
      }
      while (cls--)
        w(cln);
      cls = 1;
      cln = c[i];
    }
  }
  return { c: cl.subarray(0, cli), n: s };
};
var clen = function(cf, cl) {
  var l = 0;
  for (var i = 0; i < cl.length; ++i)
    l += cf[i] * cl[i];
  return l;
};
var wfblk = function(out, pos, dat) {
  var s = dat.length;
  var o = shft(pos + 2);
  out[o] = s & 255;
  out[o + 1] = s >> 8;
  out[o + 2] = out[o] ^ 255;
  out[o + 3] = out[o + 1] ^ 255;
  for (var i = 0; i < s; ++i)
    out[o + i + 4] = dat[i];
  return (o + 4 + s) * 8;
};
var wblk = function(dat, out, final, syms, lf, df, eb, li, bs, bl, p) {
  wbits(out, p++, final);
  ++lf[256];
  var _a2 = hTree(lf, 15), dlt = _a2.t, mlb = _a2.l;
  var _b2 = hTree(df, 15), ddt = _b2.t, mdb = _b2.l;
  var _c = lc(dlt), lclt = _c.c, nlc = _c.n;
  var _d = lc(ddt), lcdt = _d.c, ndc = _d.n;
  var lcfreq = new u16(19);
  for (var i = 0; i < lclt.length; ++i)
    ++lcfreq[lclt[i] & 31];
  for (var i = 0; i < lcdt.length; ++i)
    ++lcfreq[lcdt[i] & 31];
  var _e = hTree(lcfreq, 7), lct = _e.t, mlcb = _e.l;
  var nlcc = 19;
  for (; nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc)
    ;
  var flen = bl + 5 << 3;
  var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
  var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + 2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18];
  if (bs >= 0 && flen <= ftlen && flen <= dtlen)
    return wfblk(out, p, dat.subarray(bs, bs + bl));
  var lm, ll, dm, dl;
  wbits(out, p, 1 + (dtlen < ftlen)), p += 2;
  if (dtlen < ftlen) {
    lm = hMap(dlt, mlb, 0), ll = dlt, dm = hMap(ddt, mdb, 0), dl = ddt;
    var llm = hMap(lct, mlcb, 0);
    wbits(out, p, nlc - 257);
    wbits(out, p + 5, ndc - 1);
    wbits(out, p + 10, nlcc - 4);
    p += 14;
    for (var i = 0; i < nlcc; ++i)
      wbits(out, p + 3 * i, lct[clim[i]]);
    p += 3 * nlcc;
    var lcts = [lclt, lcdt];
    for (var it = 0; it < 2; ++it) {
      var clct = lcts[it];
      for (var i = 0; i < clct.length; ++i) {
        var len = clct[i] & 31;
        wbits(out, p, llm[len]), p += lct[len];
        if (len > 15)
          wbits(out, p, clct[i] >> 5 & 127), p += clct[i] >> 12;
      }
    }
  } else {
    lm = flm, ll = flt, dm = fdm, dl = fdt;
  }
  for (var i = 0; i < li; ++i) {
    var sym = syms[i];
    if (sym > 255) {
      var len = sym >> 18 & 31;
      wbits16(out, p, lm[len + 257]), p += ll[len + 257];
      if (len > 7)
        wbits(out, p, sym >> 23 & 31), p += fleb[len];
      var dst = sym & 31;
      wbits16(out, p, dm[dst]), p += dl[dst];
      if (dst > 3)
        wbits16(out, p, sym >> 5 & 8191), p += fdeb[dst];
    } else {
      wbits16(out, p, lm[sym]), p += ll[sym];
    }
  }
  wbits16(out, p, lm[256]);
  return p + ll[256];
};
var deo = /* @__PURE__ */ new i32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
var et = /* @__PURE__ */ new u8(0);
var dflt = function(dat, lvl, plvl, pre, post, st) {
  var s = st.z || dat.length;
  var o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7e3)) + post);
  var w = o.subarray(pre, o.length - post);
  var lst = st.l;
  var pos = (st.r || 0) & 7;
  if (lvl) {
    if (pos)
      w[0] = st.r >> 3;
    var opt = deo[lvl - 1];
    var n = opt >> 13, c = opt & 8191;
    var msk_1 = (1 << plvl) - 1;
    var prev = st.p || new u16(32768), head = st.h || new u16(msk_1 + 1);
    var bs1_1 = Math.ceil(plvl / 3), bs2_1 = 2 * bs1_1;
    var hsh = function(i2) {
      return (dat[i2] ^ dat[i2 + 1] << bs1_1 ^ dat[i2 + 2] << bs2_1) & msk_1;
    };
    var syms = new i32(25e3);
    var lf = new u16(288), df = new u16(32);
    var lc_1 = 0, eb = 0, i = st.i || 0, li = 0, wi = st.w || 0, bs = 0;
    for (; i + 2 < s; ++i) {
      var hv = hsh(i);
      var imod = i & 32767, pimod = head[hv];
      prev[imod] = pimod;
      head[hv] = imod;
      if (wi <= i) {
        var rem = s - i;
        if ((lc_1 > 7e3 || li > 24576) && (rem > 423 || !lst)) {
          pos = wblk(dat, w, 0, syms, lf, df, eb, li, bs, i - bs, pos);
          li = lc_1 = eb = 0, bs = i;
          for (var j = 0; j < 286; ++j)
            lf[j] = 0;
          for (var j = 0; j < 30; ++j)
            df[j] = 0;
        }
        var l = 2, d = 0, ch_1 = c, dif = imod - pimod & 32767;
        if (rem > 2 && hv == hsh(i - dif)) {
          var maxn = Math.min(n, rem) - 1;
          var maxd = Math.min(32767, i);
          var ml = Math.min(258, rem);
          while (dif <= maxd && --ch_1 && imod != pimod) {
            if (dat[i + l] == dat[i + l - dif]) {
              var nl = 0;
              for (; nl < ml && dat[i + nl] == dat[i + nl - dif]; ++nl)
                ;
              if (nl > l) {
                l = nl, d = dif;
                if (nl > maxn)
                  break;
                var mmd = Math.min(dif, nl - 2);
                var md = 0;
                for (var j = 0; j < mmd; ++j) {
                  var ti = i - dif + j & 32767;
                  var pti = prev[ti];
                  var cd = ti - pti & 32767;
                  if (cd > md)
                    md = cd, pimod = ti;
                }
              }
            }
            imod = pimod, pimod = prev[imod];
            dif += imod - pimod & 32767;
          }
        }
        if (d) {
          syms[li++] = 268435456 | revfl[l] << 18 | revfd[d];
          var lin = revfl[l] & 31, din = revfd[d] & 31;
          eb += fleb[lin] + fdeb[din];
          ++lf[257 + lin];
          ++df[din];
          wi = i + l;
          ++lc_1;
        } else {
          syms[li++] = dat[i];
          ++lf[dat[i]];
        }
      }
    }
    for (i = Math.max(i, wi); i < s; ++i) {
      syms[li++] = dat[i];
      ++lf[dat[i]];
    }
    pos = wblk(dat, w, lst, syms, lf, df, eb, li, bs, i - bs, pos);
    if (!lst) {
      st.r = pos & 7 | w[pos / 8 | 0] << 3;
      pos -= 7;
      st.h = head, st.p = prev, st.i = i, st.w = wi;
    }
  } else {
    for (var i = st.w || 0; i < s + lst; i += 65535) {
      var e = i + 65535;
      if (e >= s) {
        w[pos / 8 | 0] = lst;
        e = s;
      }
      pos = wfblk(w, pos + 1, dat.subarray(i, e));
    }
    st.i = s;
  }
  return slc(o, 0, pre + shft(pos) + post);
};
var dopt = function(dat, opt, pre, post, st) {
  if (!st) {
    st = { l: 1 };
    if (opt.dictionary) {
      var dict = opt.dictionary.subarray(-32768);
      var newDat = new u8(dict.length + dat.length);
      newDat.set(dict);
      newDat.set(dat, dict.length);
      dat = newDat;
      st.w = dict.length;
    }
  }
  return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? st.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : 20 : 12 + opt.mem, pre, post, st);
};
var zls = function(d, dict) {
  if ((d[0] & 15) != 8 || d[0] >> 4 > 7 || (d[0] << 8 | d[1]) % 31)
    err(6, "invalid zlib data");
  if ((d[1] >> 5 & 1) == +!dict)
    err(6, "invalid zlib data: " + (d[1] & 32 ? "need" : "unexpected") + " dictionary");
  return (d[1] >> 3 & 4) + 2;
};
function deflateSync(data, opts) {
  return dopt(data, opts || {}, 0, 0);
}
var Inflate = /* @__PURE__ */ (function() {
  function Inflate2(opts, cb) {
    if (typeof opts == "function")
      cb = opts, opts = {};
    this.ondata = cb;
    var dict = opts && opts.dictionary && opts.dictionary.subarray(-32768);
    this.s = { i: 0, b: dict ? dict.length : 0 };
    this.o = new u8(32768);
    this.p = new u8(0);
    if (dict)
      this.o.set(dict);
  }
  Inflate2.prototype.e = function(c) {
    if (!this.ondata)
      err(5);
    if (this.d)
      err(4);
    if (!this.p.length)
      this.p = c;
    else if (c.length) {
      var n = new u8(this.p.length + c.length);
      n.set(this.p), n.set(c, this.p.length), this.p = n;
    }
  };
  Inflate2.prototype.c = function(final) {
    this.s.i = +(this.d = final || false);
    var bts = this.s.b;
    var dt = inflt(this.p, this.s, this.o);
    this.ondata(slc(dt, bts, this.s.b), this.d);
    this.o = slc(dt, this.s.b - 32768), this.s.b = this.o.length;
    this.p = slc(this.p, this.s.p / 8 | 0), this.s.p &= 7;
  };
  Inflate2.prototype.push = function(chunk, final) {
    this.e(chunk), this.c(final);
  };
  return Inflate2;
})();
var Unzlib = /* @__PURE__ */ (function() {
  function Unzlib2(opts, cb) {
    Inflate.call(this, opts, cb);
    this.v = opts && opts.dictionary ? 2 : 1;
  }
  Unzlib2.prototype.push = function(chunk, final) {
    Inflate.prototype.e.call(this, chunk);
    if (this.v) {
      if (this.p.length < 6 && !final)
        return;
      this.p = this.p.subarray(zls(this.p, this.v - 1)), this.v = 0;
    }
    if (final) {
      if (this.p.length < 4)
        err(6, "invalid zlib data");
      this.p = this.p.subarray(0, -4);
    }
    Inflate.prototype.c.call(this, final);
  };
  return Unzlib2;
})();
var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
var tds = 0;
try {
  td.decode(et, { stream: true });
  tds = 1;
} catch (e) {
}

// src/legacy.js
var alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789()";
var LIMIT = 4 * 1024 * 1024;
function decodePrint(text) {
  const out = [];
  let bits2 = 0, cache = 0;
  for (const char of text) {
    const n = alphabet.indexOf(char);
    if (n < 0) throw Error("Invalid !E1! printable data.");
    cache |= n << bits2;
    bits2 += 6;
    if (bits2 >= 8) {
      out.push(cache & 255);
      cache >>>= 8;
      bits2 -= 8;
    }
  }
  if (bits2 && cache) throw Error("Invalid !E1! padding.");
  return Uint8Array.from(out);
}
function inflateLimited(input) {
  let chunks = [], length = 0;
  const stream = new Inflate((part) => {
    length += part.length;
    if (length > LIMIT) throw Error("Decoded profile exceeds the 4 MB limit.");
    chunks.push(part);
  });
  for (let i = 0; i < input.length; i += 256) stream.push(input.subarray(i, i + 256), i + 256 >= input.length);
  const out = new Uint8Array(length);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.length;
  }
  return out;
}
function unescapeAce(s) {
  const bytes = [];
  for (let i = 0; i < s.length; i++) {
    let n = s.charCodeAt(i);
    if (n === 126) {
      if (++i >= s.length) throw Error("Incomplete AceSerializer escape.");
      n = s.charCodeAt(i);
      n = n === 122 ? 30 : n === 123 ? 127 : n === 124 ? 126 : n === 125 ? 94 : n - 64;
      if (n < 0 || n > 127) throw Error("Invalid AceSerializer escape.");
    }
    bytes.push(n);
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bytes));
}
function deserializeAce(source2) {
  let i = 0, nodes = 0;
  const token = () => {
    if (source2[i++] !== "^" || i >= source2.length) throw Error("Invalid AceSerializer token.");
    const kind = source2[i++];
    if (kind === "^") return { kind };
    const end = source2.indexOf("^", i);
    if (end < 0) throw Error("Incomplete AceSerializer data.");
    const data = source2.slice(i, end);
    i = end;
    return { kind, data };
  };
  if (token().kind !== "1") throw Error("Unsupported AceSerializer version.");
  function value(t, depth = 0) {
    if (++nodes > 1e5 || depth > 100) throw Error("Profile is too large or nested too deeply.");
    switch (t.kind) {
      case "S":
        return unescapeAce(t.data);
      case "N": {
        const n = Number(t.data);
        if (!Number.isFinite(n)) throw Error("Invalid AceSerializer number.");
        return n;
      }
      case "F": {
        const e = token();
        if (e.kind !== "f") throw Error("Invalid AceSerializer float.");
        const n = Number(t.data) * 2 ** Number(e.data);
        if (!Number.isFinite(n)) throw Error("Invalid AceSerializer float.");
        return n;
      }
      case "B":
        return true;
      case "b":
        return false;
      case "T": {
        const map = /* @__PURE__ */ new Map();
        while (true) {
          const k = token();
          if (k.kind === "t") return map;
          const key = value(k, depth + 1);
          if (typeof key !== "string" && typeof key !== "boolean" && !(typeof key === "number" && Number.isFinite(key))) throw Error("Unsupported AceSerializer table key.");
          map.set(key, value(token(), depth + 1));
        }
      }
      default:
        throw Error("Unsupported AceSerializer value.");
    }
  }
  const profile2 = value(token());
  if (!(profile2 instanceof Map) || token().kind !== "^" || i !== source2.length) throw Error("Invalid !E1! profile table.");
  return profile2;
}
function decodeE1(text) {
  const encoded = text.slice(4).replace(/\s/g, "");
  if (!encoded) throw Error("Empty !E1! profile.");
  let data;
  try {
    data = inflateLimited(decodePrint(encoded));
  } catch (e) {
    if (e.message.includes("limit")) throw e;
    throw Error("Could not decompress this !E1! profile.");
  }
  const source2 = new TextDecoder("utf-8", { fatal: true }).decode(data);
  const marker = source2.lastIndexOf("^^::profile::");
  if (marker < 0) throw Error("Only character profiles can be upgraded from !E1!.");
  const name2 = source2.slice(marker + 13);
  const profile2 = deserializeAce(source2.slice(0, marker + 2));
  return { name: name2 || "Imported profile", profile: profile2, format: "E1" };
}

// src/profile.js
var LIMIT2 = 4 * 1024 * 1024;
function get(root, path, fallback) {
  let v = root;
  for (const k of path) {
    if (!(v instanceof Map)) return fallback;
    v = v.get(k);
  }
  return v === void 0 ? fallback : v;
}
function set(root, path, value) {
  let t = root;
  for (const k of path.slice(0, -1)) {
    if (!t.has(k)) t.set(k, /* @__PURE__ */ new Map());
    if (!(t.get(k) instanceof Map)) throw Error(`Cannot edit ${path.join(".")}: existing data is not a table.`);
    t = t.get(k);
  }
  t.set(path.at(-1), value);
}
function clone(value) {
  return structuredClone(value);
}
function validKey(k) {
  return typeof k === "string" || typeof k === "boolean" || typeof k === "number" && Number.isFinite(k);
}
function fromAst(n, depth = 0) {
  if (depth > 100) throw Error("This profile is nested too deeply.");
  if (n.type === "TableConstructorExpression") {
    const m = /* @__PURE__ */ new Map();
    let i = 1;
    for (const f of n.fields) {
      let k;
      if (f.type === "TableKeyString") k = f.key.name;
      else if (f.type === "TableKey") k = fromAst(f.key, depth + 1);
      else if (f.type === "TableValue") k = i++;
      else throw Error("Unsupported table entry.");
      if (!validKey(k)) throw Error("Unsupported table key.");
      const v = fromAst(f.value, depth + 1);
      if (v !== null) m.set(k, v);
      else m.delete(k);
    }
    return m;
  }
  if (n.type === "StringLiteral") {
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(n.value, (c) => c.charCodeAt(0)));
    } catch {
      throw Error("A Lua string contains non-UTF-8 binary data. It cannot be safely edited in this version.");
    }
  }
  if (n.type === "NumericLiteral") {
    if (!Number.isFinite(n.value)) throw Error("Non-finite numbers are not supported.");
    return n.value;
  }
  if (n.type === "BooleanLiteral") return n.value;
  if (n.type === "NilLiteral") return null;
  if (n.type === "UnaryExpression" && n.operator === "-" && n.argument.type === "NumericLiteral") return -fromAst(n.argument, depth + 1);
  throw Error("Only saved data is supported. Lua code, function calls, and expressions are never executed.");
}
function quote(s) {
  return '"' + s.replace(/[\\"\x00-\x1f\x7f]/g, (c) => c === "\\" ? "\\\\" : c === '"' ? '\\"' : "\\" + c.charCodeAt(0).toString().padStart(3, "0")) + '"';
}
function toLua(v, depth = 0) {
  if (depth > 100) throw Error("Profile is nested too deeply.");
  if (v instanceof Map) return "{" + [...v].map(([k, x]) => {
    if (!validKey(k)) throw Error("Unsupported table key.");
    return "[" + toLua(k, depth + 1) + "]=" + toLua(x, depth + 1);
  }).join(",") + "}";
  if (typeof v === "string") return quote(v);
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "boolean") return String(v);
  throw Error("This profile contains a value that cannot safely be exported to Lua.");
}
function normalize(v, depth = 0) {
  if (depth > 100) throw Error("Profile is nested too deeply.");
  if (v instanceof Map) {
    let out = /* @__PURE__ */ new Map();
    for (const [k, x] of v) {
      if (!validKey(k)) throw Error("Unsupported CBOR table key.");
      out.set(k, normalize(x, depth + 1));
    }
    return out;
  }
  if (Array.isArray(v)) return new Map(v.map((x, i) => [i + 1, normalize(x, depth + 1)]));
  if (typeof v === "string" || typeof v === "boolean" || typeof v === "number" && Number.isFinite(v)) return v;
  throw Error("Unsupported CBOR value. Use an ElvUI Lua table export or saved settings file.");
}
function inflateLimited2(bytes, zlib) {
  let chunks = [], total = 0;
  const stream = new (zlib ? Unzlib : Inflate)((part) => {
    total += part.length;
    if (total > LIMIT2) throw Error("Decoded profile exceeds the 4 MB limit.");
    chunks.push(part);
  });
  for (let i = 0; i < bytes.length; i += 256) stream.push(bytes.subarray(i, i + 256), i + 256 >= bytes.length);
  let out = new Uint8Array(total), p = 0;
  for (const c of chunks) {
    out.set(c, p);
    p += c.length;
  }
  return out;
}
function decodeE2(text) {
  const s = text.slice(4).replace(/\s/g, "");
  if (!s || !/^[A-Za-z0-9+/]*={0,2}$/.test(s)) throw Error("Invalid !E2! Base64 data.");
  let raw;
  try {
    raw = Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  } catch {
    throw Error("Invalid !E2! Base64 data.");
  }
  let bytes;
  try {
    bytes = inflateLimited2(raw, false);
  } catch (e) {
    if (e.message.includes("limit")) throw e;
    try {
      bytes = inflateLimited2(raw, true);
    } catch {
      throw Error("Could not decompress this profile. It may be incomplete or use an unsupported format.");
    }
  }
  const decoder2 = new Decoder({ mapsAsObjects: false, useRecords: false });
  try {
    const profile3 = normalize(decoder2.decode(bytes));
    if (profile3 instanceof Map) return { name: "Imported profile", profile: profile3, format: "E2" };
  } catch {
  }
  let marker = -1;
  const suffix = new TextEncoder().encode("::profile::");
  for (let i = bytes.length - suffix.length; i >= 0; i--) {
    if (suffix.every((c, j) => bytes[i + j] === c)) {
      marker = i;
      break;
    }
  }
  if (marker < 0) throw Error("Could not read this !E2! profile. The data may be incomplete or use an unsupported format.");
  const name2 = new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(marker + suffix.length));
  const profile2 = normalize(decoder2.decode(bytes.subarray(0, marker)));
  if (!(profile2 instanceof Map)) throw Error("The profile root must be a table.");
  return { name: name2 || "Imported profile", profile: profile2, format: "E2" };
}
function exportProfile(profile2, name2, format = "lua") {
  name2 = name2.trim();
  if (!name2 || name2.length > 50 || /[\x00-\x1f:]/.test(name2)) throw Error("Use a profile name of 1\u201350 characters without colons or control characters.");
  const lua = toLua(profile2);
  if (format === "lua") return `${lua.replace(/\|/g, "||")}::profile::${name2}`;
  const data = new Encoder({ useRecords: false, mapsAsObjects: false, structuredClone: false }).encode(profile2);
  const suffix = new TextEncoder().encode("::profile::" + name2), all = new Uint8Array(data.length + suffix.length);
  all.set(data);
  all.set(suffix, data.length);
  const compressed = deflateSync(all);
  let binary = "";
  for (const b of compressed) binary += String.fromCharCode(b);
  return "!E2!" + btoa(binary);
}
function parseInput(input) {
  const text = input.replace(/^\uFEFF/, "").trim();
  if (!text) throw Error("Paste a profile or choose an ElvUI.lua file.");
  if (new TextEncoder().encode(text).length > LIMIT2) throw Error("The maximum import size is 4 MB.");
  if (text.startsWith("!E2!")) return { profiles: [decodeE2(text)] };
  if (text.startsWith("!E1!")) return { profiles: [decodeE1(text)] };
  let ast, name2 = "Imported profile";
  let source2 = text;
  if (text.startsWith("{")) {
    const match = text.match(/^([\s\S]+)::profile::([^\r\n]*)$/);
    if (match) {
      source2 = match[1].replace(/\|\|/g, "|");
      name2 = match[2] || name2;
    } else if (/::(private|global|filters)$/.test(text)) throw Error("Import a character profile rather than Global, Private, or Filters settings.");
    source2 = "return " + source2;
  }
  let byteSource = "";
  for (const b of new TextEncoder().encode(source2)) byteSource += String.fromCharCode(b);
  try {
    ast = import_luaparse.default.parse(byteSource, { luaVersion: "5.1", encodingMode: "pseudo-latin1", comments: false, scope: false, locations: false });
  } catch (e) {
    throw Error("Could not read this Lua data. Use a complete ElvUI.lua saved settings file or a Lua table profile export. " + e.message);
  }
  if (ast.body.length === 1 && ast.body[0].type === "ReturnStatement" && ast.body[0].arguments.length === 1) {
    const profile2 = fromAst(ast.body[0].arguments[0]);
    if (!(profile2 instanceof Map)) throw Error("Expected a profile table.");
    return { profiles: [{ name: name2, profile: profile2, format: "Lua" }] };
  }
  let elv;
  for (const stmt of ast.body) {
    if (stmt.type !== "AssignmentStatement" || stmt.variables.length !== 1 || stmt.variables[0].type !== "Identifier" || stmt.init.length !== 1) throw Error("This file contains executable Lua. Only saved-variable assignments are accepted.");
    const v = fromAst(stmt.init[0]);
    if (stmt.variables[0].name === "ElvDB") elv = v;
  }
  const profiles = get(elv, ["profiles"]);
  if (!(profiles instanceof Map) || profiles.size === 0) throw Error("No ElvDB.profiles found. Choose the account SavedVariables/ElvUI.lua file.");
  const out = [...profiles].map(([name3, profile2]) => {
    if (typeof name3 !== "string" || !(profile2 instanceof Map)) throw Error("Invalid profile entry in saved settings.");
    return { name: name3, profile: profile2, format: "SavedVariables" };
  });
  return { profiles: out };
}

// src/model.js
var ANCHORS = ["TOPLEFT", "TOP", "TOPRIGHT", "LEFT", "CENTER", "RIGHT", "BOTTOMLEFT", "BOTTOM", "BOTTOMRIGHT"];
var unit = (id, label, mover, x, y, w = 270, h = 54) => ({ id, label, mover, kind: id, path: ["unitframe", "units", id], w, h, x, y, resize: true, enable: true });
var DEFAULT_ENABLED_BARS = /* @__PURE__ */ new Set([1, 3, 4, 5]);
var bar = (n, x = 0, y = -370) => ({ id: `bar${n}`, label: `Action bar ${n}`, mover: `ElvAB_${n}`, kind: "bar", path: ["actionbar", `bar${n}`], x, y, w: 406, h: 32, enable: true, enableKey: "enabled", defaultEnabled: DEFAULT_ENABLED_BARS.has(n), defaultButtons: n === 3 || n === 5 ? 6 : 12, defaultCols: n === 4 ? 1 : n === 3 || n === 5 ? 6 : 12, defaultBackdrop: n === 4 });
var ACTION_BAR_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 14, 15];
var BENIKUI_PORTRAITS = [["player", "Player"], ["target", "Target"], ["targettarget", "Target target"], ["focus", "Focus"], ["pet", "Pet"]];
var BENIKUI_DASHBOARDS = [
  ["system", "BuiDashboardMover", "System dashboard", 150],
  ["tokens", "tokenHolderMover", "Tokens dashboard", 150],
  ["professions", "ProfessionsMover", "Professions dashboard", 150],
  ["reputations", "reputationHolderMover", "Reputations dashboard", 200],
  ["items", "itemsHolderMover", "Items dashboard", 150]
];
var BASE_DEFINITIONS = [unit("player", "Player", "ElvUF_PlayerMover", -320, -180), unit("target", "Target", "ElvUF_TargetMover", 320, -180), unit("focus", "Focus", "ElvUF_FocusMover", -320, -95, 180, 36), unit("pet", "Pet", "ElvUF_PetMover", -320, -250, 180, 30), bar(1), bar(2, 0, -326), { id: "minimap", label: "Minimap", mover: "MinimapMover", kind: "minimap", path: ["general", "minimap"], x: 805, y: 380, w: 170, h: 170, resize: true }, { id: "leftchat", label: "Left chat", mover: "LeftChatMover", kind: "chat", x: -725, y: -355, w: 400, h: 180 }, { id: "rightchat", label: "Right chat", mover: "RightChatMover", kind: "chat", x: 725, y: -355, w: 400, h: 180 }, { id: "raid1", label: "Raid group", mover: "ElvUF_Raid1Mover", kind: "raid", path: ["unitframe", "units", "raid1"], x: -745, y: 0, w: 300, h: 190 }];
var DEFINITIONS = [...BASE_DEFINITIONS];
function newProfile() {
  const p = /* @__PURE__ */ new Map();
  for (const d of DEFINITIONS) {
    set(p, ["movers", d.mover], `CENTER,UIParent,CENTER,${d.x},${d.y}`);
    if (d.enable) set(p, [...d.path, d.enableKey || "enable"], true);
    if (d.resize) {
      if (d.kind === "minimap") set(p, [...d.path, "size"], d.w);
      else {
        set(p, [...d.path, "width"], d.w);
        set(p, [...d.path, "height"], d.h);
      }
    }
    if (d.kind === "bar") {
      set(p, [...d.path, "buttons"], d.defaultButtons);
      set(p, [...d.path, "buttonsPerRow"], d.defaultCols);
      set(p, [...d.path, "buttonSize"], 32);
      set(p, [...d.path, "buttonSpacing"], 2);
    }
  }
  set(p, ["chat", "panelWidth"], 400);
  set(p, ["chat", "panelHeight"], 180);
  return p;
}
function anchorFraction(a) {
  return [a.includes("LEFT") ? 0 : a.includes("RIGHT") ? 1 : 0.5, a.includes("TOP") ? 0 : a.includes("BOTTOM") ? 1 : 0.5];
}
function parseMover(value) {
  if (typeof value !== "string") return null;
  const [anchor, parent, relative, x, y, ...rest] = value.split(value.includes("") ? "" : ",");
  if (rest.length || !ANCHORS.includes(anchor) || !ANCHORS.includes(relative) || !parent || !Number.isFinite(Number(x)) || !Number.isFinite(Number(y))) return null;
  return { anchor, parent, relative, x: Number(x), y: Number(y) };
}
function actionBarLayout(p, d) {
  const path = d.path, n = get(p, [...path, "buttons"], d.defaultButtons), cols = Math.max(1, Math.min(n, get(p, [...path, "buttonsPerRow"], d.defaultCols))), size = get(p, [...path, "buttonSize"], 32), height = get(p, [...path, "keepSizeRatio"], true) === false ? get(p, [...path, "buttonHeight"], 32) : size, gap = get(p, [...path, "buttonSpacing"], 2), rows = Math.ceil(n / cols), w = cols * size + (cols - 1) * gap, h = rows * height + (rows - 1) * gap, backdrop = get(p, [...path, "backdrop"], d.defaultBackdrop ?? false), inset = backdrop ? get(p, [...path, "backdropSpacing"], 2) : 0;
  return { n, cols, size, height, gap, rows, w, h, backdrop, inset, moverW: w + inset * 2, moverH: h + inset * 2 };
}
function dimensions(p, d) {
  let w = d.w, h = d.h;
  let path = d.dimensionPath || d.path;
  if (d.kind === "bar") ({ w, h } = actionBarLayout(p, d));
  else if (d.kind === "minimap") w = h = get(p, [...path, "size"], 170);
  else if (d.kind === "chat") {
    const right = d.id === "rightchat" && get(p, ["chat", "separateSizes"], false);
    w = get(p, ["chat", right ? "panelWidthRight" : "panelWidth"], 400);
    h = get(p, ["chat", right ? "panelHeightRight" : "panelHeight"], 180);
  } else if (d.resize) {
    w = get(p, [...path, d.widthKey || "width"], w);
    h = get(p, [...path, d.heightKey || "height"], h);
  }
  return { w: typeof w === "number" && w > 0 ? Math.min(w, 8e3) : d.w, h: typeof h === "number" && h > 0 ? Math.min(h, 8e3) : d.h };
}
function benikUIDashboardHeight(p, key) {
  const path = ["benikui", "dashboards", key], orientation = get(p, [...path, "orientation"], "BOTTOM"), spacing = get(p, [...path, "spacing"], 1);
  let rows = 1;
  if (key === "system") {
    const choices = get(p, [...path, "chooseSystem"]);
    rows = choices instanceof Map ? [...choices.values()].filter(Boolean).length : 5;
  }
  return orientation === "BOTTOM" ? 23 * Math.max(1, rows) + 3 : 23;
}
function benikUIDefinitions(p) {
  const movers = get(p, ["movers"]), bui = get(p, ["benikui"]), hasBui = bui instanceof Map, defs = [];
  const add = (d) => {
    if (hasBui || get(movers, [d.mover]) !== void 0) defs.push({ ...d, plugin: "BenikUI" });
  };
  for (const [unitId, label] of BENIKUI_PORTRAITS) {
    const path = ["benikui", "unitframes", unitId], dimensionPath = unitId === "target" && get(p, [...path, "getPlayerPortraitSize"], true) !== false ? ["benikui", "unitframes", "player"] : path;
    add({ id: `benikui-portrait-${unitId}`, label: `${label} portrait`, mover: `${unitId === "targettarget" ? "TargetTarget" : label}PortraitMover`, kind: "benikui", subkind: "portrait", path, dimensionPath, widthKey: "portraitWidth", heightKey: "portraitHeight", enable: true, enableKey: "detachPortrait", defaultEnabled: false, resize: true, w: 110, h: 85, x: unitId === "player" ? -460 : 460, y: -180 });
  }
  for (const [key, mover, label, width] of BENIKUI_DASHBOARDS) {
    const path = ["benikui", "dashboards", key], orientation = get(p, [...path, "orientation"], "BOTTOM"), rows = key === "system" ? get(p, [...path, "chooseSystem"]) instanceof Map ? [...get(p, [...path, "chooseSystem"]).values()].filter(Boolean).length : 5 : 1, w = get(p, [...path, "width"], width), h = benikUIDashboardHeight(p, key);
    add({ id: `benikui-dashboard-${key}`, label, mover, kind: "benikui", subkind: "dashboard", path, enable: true, defaultEnabled: true, w: orientation === "BOTTOM" ? w : w * Math.max(1, rows) + (Math.max(1, rows) - 1) * get(p, [...path, "spacing"], 1), h, x: -750, y: 360 });
  }
  add({ id: "benikui-request-stop", label: "Request stop button", mover: "RequestStopButton", kind: "benikui", subkind: "button", path: ["benikui", "actionbars"], enable: true, enableKey: "requestStop", defaultEnabled: true, w: 240, h: 40, x: 0, y: 390 });
  for (const [key, mover, label, y] of [["mawBar", "BUIMawBarMover", "Maw bar", 365], ["preyBar", "BUIPreyBarMover", "Prey bar", 390]]) add({ id: `benikui-${key}`, label, mover, kind: "benikui", subkind: "widgetbar", path: ["benikui", "widgetbars", key], enable: true, defaultEnabled: true, resize: true, w: get(p, ["benikui", "widgetbars", key, "width"], 222), h: get(p, ["benikui", "widgetbars", key, "height"], 5), x: 0, y });
  if (bui instanceof Map) {
    const panels = get(bui, ["panels"]);
    if (panels instanceof Map) for (const [name2, data] of panels) {
      if (typeof name2 !== "string" || !(data instanceof Map)) continue;
      defs.push({ id: `benikui-panel-${name2}`, label: name2.replace(/^BenikUI_/, ""), mover: `${name2}_Mover`, kind: "benikui", subkind: "panel", plugin: "BenikUI", path: ["benikui", "panels", name2], enable: true, defaultEnabled: true, resize: true, w: get(data, ["width"], 200), h: get(data, ["height"], 200), x: -600, y: 0 });
    }
  }
  return defs;
}
function framesFor(p, viewport2) {
  const defs = [...DEFINITIONS], movers = get(p, ["movers"]);
  for (const n of ACTION_BAR_IDS.slice(2)) {
    const d = bar(n, n === 4 ? 900 : n >= 6 ? 850 : 0, n === 3 ? -280 : n === 4 ? 0 : n === 5 ? -370 : 140 + (n - 6) * 38);
    if (get(p, d.path) instanceof Map || get(p, ["movers", d.mover]) !== void 0) defs.splice(4 + n, 0, d);
  }
  defs.push(...benikUIDefinitions(p));
  if (movers instanceof Map) {
    for (const [m] of movers) if (typeof m === "string" && !defs.some((d) => d.mover === m)) {
      const label = m.replace(/Mover$/, "").replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").trim() || m;
      defs.push({ id: m, label, kind: "anchor", mover: m, w: 12, h: 12, x: 0, y: 0, anchorOnly: true });
    }
  }
  const frames2 = defs.map((d) => {
    const raw = get(p, ["movers", d.mover]), dims = dimensions(p, d), layout = d.kind === "bar" ? actionBarLayout(p, d) : null;
    return { ...d, ...dims, moverW: layout?.moverW ?? dims.w, moverH: layout?.moverH ?? dims.h, inset: layout?.inset ?? 0, enabled: d.enable ? get(p, [...d.path, d.enableKey || "enable"], d.defaultEnabled ?? true) !== false : true, moverData: parseMover(raw), raw, estimated: raw === void 0 };
  });
  const roots = ["UIParent", "ElvUIParent"];
  function resolve(f, seen = /* @__PURE__ */ new Set()) {
    if (f.anchorRect) return f.anchorRect;
    if (seen.has(f.id)) {
      f.warning = "Circular relative anchor; position editing is unavailable.";
      return null;
    }
    seen.add(f.id);
    let m = f.moverData;
    if (!m) {
      if (f.raw !== void 0) {
        f.warning = "Unrecognized mover format; retained without changes.";
        return null;
      }
      m = { anchor: "CENTER", parent: "UIParent", relative: "CENTER", x: f.x, y: f.y };
    }
    let parent;
    if (roots.includes(m.parent)) parent = { left: 0, top: 0, w: viewport2.w, h: viewport2.h };
    else {
      const other = frames2.find((x) => x.mover === m.parent);
      if (other) parent = resolve(other, seen);
    }
    if (!parent) {
      f.warning = f.warning || `Relative frame ${m.parent} cannot be previewed. Position is retained.`;
      return null;
    }
    const a = anchorFraction(m.anchor), b = anchorFraction(m.relative), anchorX = parent.left + parent.w * b[0] + m.x, anchorY = parent.top + parent.h * b[1] - m.y;
    if (f.anchorOnly) {
      const left2 = anchorX - f.w / 2, top2 = anchorY - f.h / 2;
      f.anchorRect = f.rect = { left: left2, top: top2, w: f.w, h: f.h };
      return f.anchorRect;
    }
    const left = anchorX - f.moverW * a[0], top = anchorY - f.moverH * a[1];
    f.anchorRect = { left, top, w: f.moverW, h: f.moverH };
    f.rect = { left: left + f.inset, top: top + f.inset, w: f.w, h: f.h };
    return f.anchorRect;
  }
  for (const f of frames2) resolve(f);
  return frames2;
}
function moveFrame(p, f, left, top, viewport2) {
  if (f.warning) throw Error(f.warning);
  const x = Math.round(left + f.w / 2 - viewport2.w / 2), y = Math.round(viewport2.h / 2 - top - f.h / 2);
  set(p, ["movers", f.mover], `CENTER,UIParent,CENTER,${x},${y}`);
}
function resizeFrame(p, f, w, h) {
  if (!f.resize) throw Error("This frame does not support resizing.");
  if (!Number.isFinite(w) || !Number.isFinite(h) || w < 10 || h < 10 || w > 2e3 || h > 2e3) throw Error("Dimensions must be between 10 and 2000 UI units.");
  const path = f.dimensionPath || f.path;
  if (f.kind === "minimap") set(p, [...path, "size"], Math.round(w));
  else {
    set(p, [...path, f.widthKey || "width"], Math.round(w));
    set(p, [...path, f.heightKey || "height"], Math.round(h));
  }
}

// src/app.js
var $ = (s) => document.querySelector(s);
var esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var profile = newProfile();
var name = "My next adventure";
var selected = "player";
var source = "New layout";
var dirty = false;
var history = [];
var future = [];
var frames = [];
var drag = null;
var applyProperties = () => true;
var viewport = () => {
  const [w, h] = $("#resolution").value.split(",").map(Number), scale = Number($("#ui-scale").value);
  return { w: w / scale, h: h / scale };
};
var status = (message) => $("#status").textContent = message;
var snapshot = () => ({ profile: clone(profile), name, selected, source, dirty });
function pushHistory() {
  history.push(snapshot());
  if (history.length > 70) history.shift();
  future = [];
  dirty = true;
}
function restore(s) {
  ({ profile, name, selected, source, dirty } = s);
  $("#profile-name").value = name;
  render();
}
function mutate(fn, msg = "Layout updated") {
  const old = snapshot(), oldFuture = future;
  try {
    pushHistory();
    fn();
    render();
    status(msg);
  } catch (e) {
    history.pop();
    future = oldFuture;
    restore(old);
    status(e.message);
  }
}
function undo() {
  if (!history.length) return;
  future.push(snapshot());
  restore(history.pop());
  status("Change undone");
}
function redo() {
  if (!future.length) return;
  history.push(snapshot());
  restore(future.pop());
  status("Change restored");
}
function selectedFrame() {
  return frames.find((f) => f.id === selected);
}
function render() {
  const view = viewport();
  frames = framesFor(profile, view);
  if (!selectedFrame()) selected = frames[0].id;
  const showCustom = $("#show-unsupported").checked, custom = frames.filter((f) => f.kind === "anchor"), visible = showCustom ? frames : frames.filter((f) => f.kind !== "anchor");
  if (!visible.some((f) => f.id === selected)) selected = visible[0]?.id || frames[0].id;
  const active = visible.filter((f) => f.enabled), off = visible.length - active.length;
  $("#count").textContent = `${active.length} visible${off ? ` \xB7 ${off} off` : ""}${custom.length && !showCustom ? ` \xB7 ${custom.length} custom` : ""}`;
  $("#profile-status").textContent = source + (dirty ? " \xB7 Edited" : "");
  $("#undo").disabled = !history.length;
  $("#redo").disabled = !future.length;
  $("#layers").innerHTML = visible.map((f) => `<button class="layer ${f.id === selected ? "active" : ""}" data-id="${esc(f.id)}" aria-pressed="${f.id === selected}"><span>${esc(f.label)}</span><small>${f.warning ? "!" : f.enabled ? "\u25C7" : "off"}</small></button>`).join("");
  $("#stage").style.aspectRatio = `${view.w}/${view.h}`;
  $("#stage").style.width = `${$("#canvas-zoom").value}%`;
  $("#stage").style.backgroundSize = `${40 / view.w * 100}% ${40 / view.h * 100}%`;
  $("#stage").classList.toggle("no-grid", !$("#grid").checked);
  $("#frames").innerHTML = active.filter((f) => f.rect).map((f) => {
    let body = `<span class="fill"></span><span class="frame-text">${esc(f.label)}</span><span class="frame-text">100%</span>`;
    let style = `left:${f.rect.left / view.w * 100}%;top:${f.rect.top / view.h * 100}%;width:${f.w / view.w * 100}%;height:${f.h / view.h * 100}%;opacity:${f.enabled ? 1 : 0.32};`;
    if (f.kind === "bar") {
      const { n, cols, rows } = actionBarLayout(profile, f);
      body = Array.from({ length: n }, (_, i) => `<span class="slot">${i < 9 ? i + 1 : i === 9 ? "0" : i === 10 ? "-" : "="}</span>`).join("");
      style += `grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rows},1fr);`;
    }
    if (f.kind === "raid") body = Array.from({ length: 25 }, () => '<span class="raid-cell"></span>').join("");
    if (["chat", "minimap", "anchor", "benikui"].includes(f.kind)) body = `<span class="frame-text">${esc(f.label)}</span>`;
    return `<button class="frame ${f.kind} ${f.resize && f.kind !== "minimap" ? "power" : ""} ${f.id === selected ? "selected" : ""}" data-id="${esc(f.id)}" data-label="${esc(f.label)}" style="${style}" aria-label="${esc(f.label)}, drag or use arrow keys to move">${body}${f.id === selected && f.resize ? '<span class="handle" aria-hidden="true"></span>' : ""}</button>`;
  }).join("");
  renderProperties();
}
var field = (label, id, value, min = -99999, max2 = 99999) => `<label class="field">${label}<input id="${id}" type="number" min="${min}" max="${max2}" step="1" value="${Number(value)}" required></label>`;
function renderProperties() {
  const f = selectedFrame(), m = f.moverData || { anchor: "CENTER", parent: "UIParent", relative: "CENTER", x: f.x, y: f.y };
  $("#frame-title").textContent = f.label;
  $("#frame-kind").textContent = f.kind === "anchor" ? "CUSTOM ANCHOR" : f.plugin ? f.plugin.toUpperCase() : f.kind.toUpperCase();
  $("#frame-description").textContent = f.kind === "anchor" ? "Editable anchor \xB7 frame size is not simulated" : f.kind === "benikui" ? `BenikUI ${f.subkind} \xB7 source-backed footprint` : f.estimated ? "Estimated position \xB7 no saved mover" : f.kind === "raid" ? "Approximate group footprint" : "Position and dimensions";
  let html = "";
  if (f.warning) html += `<p class="readonly-note">${esc(f.warning)}</p>`;
  else html += `<div class="property-group"><h2>POSITION \xB7 UI UNITS</h2><div class="field-row">${field("X offset", "prop-x", m.x)}${field("Y offset", "prop-y", m.y)}</div><label class="field">Frame anchor<select id="prop-anchor">${ANCHORS.map((a) => `<option ${a === m.anchor ? "selected" : ""}>${a}</option>`).join("")}</select></label><p class="anchor-code">Relative to ${esc(m.parent)} \xB7 ${esc(m.relative)}<br>Positive Y moves upward.</p></div>`;
  if (f.resize) html += `<div class="property-group"><h2>DIMENSIONS</h2><div class="field-row">${field(f.kind === "minimap" ? "Size" : "Width", "prop-width", f.w, 10, 2e3)}${f.kind === "minimap" ? "" : field("Height", "prop-height", f.h, 10, 2e3)}</div></div>`;
  if (f.kind === "bar") html += `<div class="property-group"><h2>BUTTON LAYOUT</h2><div class="field-row">${field("Buttons", "prop-buttons", get(profile, [...f.path, "buttons"], 12), 1, 12)}${field("Per row", "prop-cols", get(profile, [...f.path, "buttonsPerRow"], 12), 1, 12)}${field("Size", "prop-size", get(profile, [...f.path, "buttonSize"], 34), 16, 100)}${field("Spacing", "prop-gap", get(profile, [...f.path, "buttonSpacing"], 2), 0, 30)}</div></div>`;
  if (f.kind === "chat") html += '<p class="muted">Chat panel size is previewed from your profile. This version edits its position only.</p>';
  if (f.kind === "raid") html += '<p class="muted">The group footprint is a placeholder. Only its saved mover position is editable.</p>';
  if (f.kind === "anchor") html += '<p class="muted">This marker represents the exact saved anchor point. The add-on frame size is unknown, so no panel footprint is invented.</p>';
  if (f.enable) html += `<div class="property-group"><label class="check" style="margin:0"><input id="prop-enable" type="checkbox" ${f.enabled ? "checked" : ""}> Enable frame in ${f.plugin || "ElvUI"}</label></div>`;
  html += `<button id="apply-properties" style="margin-top:20px">Apply properties</button><div class="property-group"><h2>PROFILE SETTING</h2><code class="anchor-code">movers.${esc(f.mover)}</code></div>`;
  $("#properties").innerHTML = html;
  $("#selection-coords").textContent = f.rect ? `${Math.round(f.w)} \xD7 ${Math.round(f.h)} UI units` : "Position unavailable";
  const inputs = [...$("#properties").querySelectorAll("input,select")];
  const value = (input) => input.type === "checkbox" ? input.checked : input.type === "number" ? Number(input.value) : input.value;
  const initial = new Map(inputs.map((input) => [input.id, value(input)]));
  applyProperties = () => {
    if (inputs.some((input) => !input.checkValidity())) {
      status("Enter a valid number within the displayed range.");
      inputs.find((input) => !input.checkValidity())?.reportValidity();
      return false;
    }
    const changed = inputs.filter((input) => value(input) !== initial.get(input.id));
    if (!changed.length) return true;
    const values = new Map(inputs.map((input) => [input.id, value(input)]));
    mutate(() => {
      if (changed.some((input) => ["prop-x", "prop-y", "prop-anchor"].includes(input.id))) set(profile, ["movers", f.mover], `${values.get("prop-anchor")},${m.parent},${m.relative},${values.get("prop-x")},${values.get("prop-y")}`);
      if (changed.some((input) => ["prop-width", "prop-height"].includes(input.id))) resizeFrame(profile, f, values.get("prop-width"), values.get("prop-height") ?? f.h);
      for (const input of changed) {
        const id = input.id;
        if (id === "prop-enable") set(profile, [...f.path, f.enableKey || "enable"], values.get(id));
        const key = { "prop-buttons": "buttons", "prop-cols": "buttonsPerRow", "prop-size": "buttonSize", "prop-gap": "buttonSpacing" }[id];
        if (key) set(profile, [...f.path, key], values.get(id));
      }
    }, `${f.label} updated`);
    return true;
  };
  $("#apply-properties").onclick = () => applyProperties();
  for (const input of inputs) input.addEventListener("change", () => applyProperties());
}
$("#layers").addEventListener("click", (e) => {
  const b = e.target.closest("[data-id]");
  if (b && applyProperties()) {
    selected = b.dataset.id;
    render();
  }
});
$("#frames").addEventListener("pointerdown", (e) => {
  const b = e.target.closest("[data-id]");
  if (!b || e.button !== 0) return;
  selected = b.dataset.id;
  const f = frames.find((f2) => f2.id === selected);
  if (!f?.rect) return;
  drag = { startX: e.clientX, startY: e.clientY, frame: clone(f), original: snapshot(), resize: e.target.classList.contains("handle"), moved: false };
  render();
  $("#stage").setPointerCapture(e.pointerId);
  e.preventDefault();
});
$("#stage").addEventListener("pointermove", (e) => {
  if (!drag) return;
  const rect = $("#stage").getBoundingClientRect(), v = viewport(), dx = (e.clientX - drag.startX) / rect.width * v.w, dy = (e.clientY - drag.startY) / rect.height * v.h;
  if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 3) return;
  if (!drag.moved) {
    pushHistory();
    drag.moved = true;
  }
  const snap = (n) => $("#snap").checked ? Math.round(n / 4) * 4 : Math.round(n), f = drag.frame;
  try {
    if (drag.resize) resizeFrame(profile, f, Math.max(10, Math.min(2e3, snap(f.w + dx))), Math.max(10, Math.min(2e3, snap(f.h + dy))));
    else moveFrame(profile, f, snap(f.rect.left + dx), snap(f.rect.top + dy), v);
    render();
  } catch (err2) {
    status(err2.message);
  }
});
function focusFrame() {
  document.querySelector(`#frames [data-id="${CSS.escape(selected)}"]`)?.focus({ preventScroll: true });
}
function finishDrag(cancel = false) {
  if (!drag) return;
  const d = drag;
  drag = null;
  if (cancel && d.moved) {
    history.pop();
    restore(d.original);
    status("Drag canceled");
  } else {
    render();
    status(d.moved ? `${d.frame.label} ${d.resize ? "resized" : "moved"}` : `${d.frame.label} selected`);
  }
  focusFrame();
}
$("#stage").addEventListener("pointerup", () => finishDrag());
$("#stage").addEventListener("pointercancel", () => finishDrag(true));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && drag) {
    finishDrag(true);
    return;
  }
  if ($("#dialog").open || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
    e.preventDefault();
    e.shiftKey ? redo() : undo();
    return;
  }
  if (e.target.closest("#frames") && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
    e.preventDefault();
    const f = selectedFrame();
    if (!f?.rect) return;
    const n = e.shiftKey ? 10 : 1;
    mutate(() => moveFrame(profile, f, f.rect.left + (e.key === "ArrowLeft" ? -n : e.key === "ArrowRight" ? n : 0), f.rect.top + (e.key === "ArrowUp" ? -n : e.key === "ArrowDown" ? n : 0), viewport()), `${f.label} nudged`);
    focusFrame();
  }
});
$("#undo").onclick = undo;
$("#redo").onclick = redo;
$("#grid").onchange = render;
$("#snap").onchange = () => status($("#snap").checked ? "4-unit snapping enabled for dragging and resizing" : "Snapping disabled; imported coordinates are unchanged");
$("#show-unsupported").onchange = () => {
  render();
  status($("#show-unsupported").checked ? "Custom anchors shown as editable markers" : "Custom anchors hidden; their profile data is still preserved");
};
$("#resolution").onchange = () => {
  render();
  status("Preview viewport updated; profile settings are unchanged");
};
$("#canvas-zoom").onchange = () => {
  const wrap = $(".stage-wrap");
  render();
  wrap.scrollTo({ left: (wrap.scrollWidth - wrap.clientWidth) / 2, top: (wrap.scrollHeight - wrap.clientHeight) / 2, behavior: "smooth" });
  status(`Canvas zoom set to ${$("#canvas-zoom").value}%; profile settings are unchanged`);
};
$("#ui-scale").onchange = () => {
  if (!$("#ui-scale").checkValidity() || !Number($("#ui-scale").value)) $("#ui-scale").value = "0.71";
  render();
  status("Preview scale updated; match this to your in-game UI scale");
};
$("#profile-name").onchange = () => {
  const next = $("#profile-name").value.trim();
  if (!next || /[\x00-\x1f:]/.test(next)) {
    status("Profile names cannot be empty or contain colons.");
    $("#profile-name").value = name;
    return;
  }
  mutate(() => name = next, "Profile renamed");
};
function dialog(html) {
  $("#dialog-body").innerHTML = html;
  if (!$("#dialog").open) $("#dialog").showModal();
}
function showHelp() {
  dialog(`<h2>Your UI, outside the game</h2><p>Import \u2192 arrange \u2192 export. All profile processing happens in your browser. Imported files are not uploaded.</p><p class="notice">WoW: Forever is the intended target. This editor currently uses Retail ElvUI settings. Forever support and in-game round-trip compatibility have not yet been verified.</p><p>Supported inputs: current <code>!E2!</code> and legacy <code>!E1!</code> character profile strings, ElvUI Lua table profile exports, and account <code>SavedVariables/ElvUI.lua</code> files.</p><p>Find your backup under your WoW installation \u2192 <code>WTF/Account/&lt;account&gt;/SavedVariables/ElvUI.lua</code>. The game-version folder depends on your installation. Keep the original backup.</p><p>The canvas is approximate. Absent mover positions use this editor\u2019s estimates, not an exact reproduction of ElvUI defaults. Custom and plugin movers are editable anchor markers when their frame dimensions are unknown. Plugins, fonts, textures, private/global settings, and combat behavior are not simulated.</p><p>Viewport and UI scale affect the preview only. Editing a frame by dragging anchors it to the center of UIParent. Unresolved relative anchors are preserved and not moved.</p><p><a href="https://github.com/tukui-org/ElvUI/blob/main/ElvUI/Game/Shared/General/Distributor.lua" target="_blank" rel="noopener">ElvUI import/export source</a> \xB7 <a href="https://github.com/tukui-org/ElvUI/wiki/export" target="_blank" rel="noopener">ElvUI profile guide</a></p>`);
}
$("#help").onclick = showHelp;
$("#import").onclick = () => {
  dialog(`<h2>Bring in your UI</h2><p>Paste an ElvUI profile or choose your saved <code>ElvUI.lua</code> file. Your file stays in this browser.</p><label for="import-text">Profile string or Lua data</label><textarea id="import-text" spellcheck="false" placeholder="!E1!\u2026 or !E2!\u2026 or { \u2026 }::profile::My profile"></textarea><label class="import-file">Or choose a saved settings file (up to 4 MB)<input id="import-file" type="file" accept=".lua,.txt"></label><p id="import-error" class="error" role="alert"></p><div id="profile-choice"></div><div class="actions"><button id="read-profile" class="primary">Read profile</button></div>`);
  $("#import-file").onchange = async () => {
    const f = $("#import-file").files[0];
    if (!f) return;
    if (f.size > LIMIT2) {
      $("#import-error").textContent = "File exceeds the 4 MB limit.";
      return;
    }
    $("#import-text").value = await f.text();
    $("#profile-choice").innerHTML = "";
  };
  $("#read-profile").onclick = () => {
    try {
      const result = parseInput($("#import-text").value);
      $("#import-error").textContent = "";
      const legacy = result.profiles.length === 1 && result.profiles[0].format === "E1";
      $("#profile-choice").innerHTML = `<label class="field">Choose a profile<select id="choose-profile">${result.profiles.map((p, i) => `<option value="${i}">${esc(p.name)}</option>`).join("")}</select></label><p class="muted">Loading replaces the working profile. You can undo it.</p><div class="actions"><button id="load-profile" class="primary">Load selected profile</button>${legacy ? '<button id="upgrade-profile">Upgrade to !E2!</button>' : ""}</div>`;
      $("#load-profile").onclick = () => {
        const p = result.profiles[Number($("#choose-profile").value)];
        mutate(() => {
          profile = clone(p.profile);
          name = p.name;
          source = `Imported ${p.format}`;
          selected = "player";
        }, `Loaded ${p.name}; original file unchanged`);
        $("#profile-name").value = name;
        $("#dialog").close();
      };
      if (legacy) $("#upgrade-profile").onclick = () => showUpgrade(result.profiles[0]);
    } catch (e) {
      $("#profile-choice").innerHTML = "";
      $("#import-error").textContent = e.message;
    }
  };
};
function download(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1e3);
}
function showUpgrade(p) {
  try {
    const upgraded = exportProfile(p.profile, p.name, "e2");
    dialog(`<h2>Classic profile upgraded</h2><p>The <strong>${esc(p.name)}</strong> profile is ready as a current <code>!E2!</code> string. Your working layout and original profile were not changed.</p><p class="notice">In-game import and WoW: Forever compatibility remain unverified. Keep the original profile as a backup.</p><label for="upgraded-text">Upgraded profile</label><textarea id="upgraded-text" readonly spellcheck="false"></textarea><p id="upgrade-error" class="error" role="alert"></p><div class="actions"><button id="download-upgrade">Download .txt</button><button id="copy-upgrade" class="primary">Copy profile</button></div>`);
    $("#upgraded-text").value = upgraded;
    $("#download-upgrade").onclick = () => download(upgraded, p.name.replace(/[^a-z0-9_-]/gi, "_") + "-upgraded-E2.txt");
    $("#copy-upgrade").onclick = async () => {
      try {
        await navigator.clipboard.writeText(upgraded);
        $("#copy-upgrade").textContent = "Copied";
      } catch {
        $("#upgraded-text").select();
        $("#upgrade-error").textContent = "Clipboard access is unavailable. Select and copy the text manually.";
      }
    };
  } catch (e) {
    $("#import-error").textContent = e.message;
  }
}
$("#export").onclick = () => {
  if (!applyProperties()) return;
  if ($("#profile-name").value.trim() !== name) $("#profile-name").onchange();
  dialog(`<h2>Ready for your next login</h2><p>Copy or download your edited profile. In ElvUI, open <strong>Profiles \u2192 Import Profile</strong>, paste the complete text, and import it under a new name.</p><p class="notice">Not yet tested in a live WoW client. Keep your original profile and verify the imported layout before replacing it. Forever compatibility remains unverified.</p><label class="field">Export format<select id="export-format"><option value="lua">ElvUI Lua table profile</option><option value="e2">Current !E2! profile string (experimental)</option></select></label><label for="export-text">Complete profile export</label><textarea id="export-text" readonly spellcheck="false"></textarea><p id="export-error" class="error" role="alert"></p><div class="actions"><button id="download">Download .txt</button><button id="copy" class="primary">Copy profile</button></div>`);
  const update = () => {
    try {
      $("#export-text").value = exportProfile(profile, name, $("#export-format").value);
      $("#export-error").textContent = "";
      $("#copy").disabled = $("#download").disabled = false;
    } catch (e) {
      $("#export-error").textContent = e.message;
      $("#export-text").value = "";
      $("#copy").disabled = $("#download").disabled = true;
    }
  };
  update();
  $("#export-format").onchange = update;
  $("#copy").onclick = async () => {
    try {
      await navigator.clipboard.writeText($("#export-text").value);
      $("#copy").textContent = "Copied";
      status("Profile copied");
    } catch {
      $("#export-text").select();
      $("#export-error").textContent = "Clipboard access is unavailable. Select and copy the text manually.";
    }
  };
  $("#download").onclick = () => {
    download($("#export-text").value, name.replace(/[^a-z0-9_-]/gi, "_") + "-ElvUI.txt");
    status("Export downloaded");
  };
};
window.addEventListener("beforeunload", (e) => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});
render();
var context = document.modelContext;
if (context?.registerTool) {
  const register = (tool) => {
    try {
      Promise.resolve(context.registerTool(tool)).catch(() => {
      });
    } catch {
    }
  };
  register({ name: "read_elvui_layout", description: "Read the current profile name, compatibility status, and frame geometry.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true }, execute: () => ({ name, target: "Forever unverified; Retail baseline", frames: frames.map((f) => ({ id: f.id, label: f.label, rect: f.rect, warning: f.warning })) }) });
  register({ name: "move_elvui_frame", description: "Move a supported frame to a top-left coordinate in UI units, updating the visible layout and export data.", inputSchema: { type: "object", properties: { id: { type: "string" }, left: { type: "number" }, top: { type: "number" } }, required: ["id", "left", "top"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: true }, execute: (input) => {
    if (!input || typeof input.id !== "string" || !Number.isFinite(input.left) || !Number.isFinite(input.top) || Math.abs(input.left) > 2e4 || Math.abs(input.top) > 2e4) throw Error("Invalid frame position.");
    const f = frames.find((f2) => f2.id === input.id);
    if (!f || !f.rect || f.warning) throw Error("Frame cannot be positioned.");
    mutate(() => moveFrame(profile, f, input.left, input.top, viewport()));
    return { id: f.id, rect: frames.find((x) => x.id === f.id).rect };
  } });
}
