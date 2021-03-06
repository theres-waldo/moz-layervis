LayerPropertyParser = /*
 * Generated by PEG.js 0.10.0.
 *
 * http://pegjs.org/
 */
(function() {
  "use strict";

  function peg$subclass(child, parent) {
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
  }

  function peg$SyntaxError(message, expected, found, location) {
    this.message  = message;
    this.expected = expected;
    this.found    = found;
    this.location = location;
    this.name     = "SyntaxError";

    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, peg$SyntaxError);
    }
  }

  peg$subclass(peg$SyntaxError, Error);

  peg$SyntaxError.buildMessage = function(expected, found) {
    var DESCRIBE_EXPECTATION_FNS = {
          literal: function(expectation) {
            return "\"" + literalEscape(expectation.text) + "\"";
          },

          "class": function(expectation) {
            var escapedParts = "",
                i;

            for (i = 0; i < expectation.parts.length; i++) {
              escapedParts += expectation.parts[i] instanceof Array
                ? classEscape(expectation.parts[i][0]) + "-" + classEscape(expectation.parts[i][1])
                : classEscape(expectation.parts[i]);
            }

            return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
          },

          any: function(expectation) {
            return "any character";
          },

          end: function(expectation) {
            return "end of input";
          },

          other: function(expectation) {
            return expectation.description;
          }
        };

    function hex(ch) {
      return ch.charCodeAt(0).toString(16).toUpperCase();
    }

    function literalEscape(s) {
      return s
        .replace(/\\/g, '\\\\')
        .replace(/"/g,  '\\"')
        .replace(/\0/g, '\\0')
        .replace(/\t/g, '\\t')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
        .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
    }

    function classEscape(s) {
      return s
        .replace(/\\/g, '\\\\')
        .replace(/\]/g, '\\]')
        .replace(/\^/g, '\\^')
        .replace(/-/g,  '\\-')
        .replace(/\0/g, '\\0')
        .replace(/\t/g, '\\t')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
        .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
    }

    function describeExpectation(expectation) {
      return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
    }

    function describeExpected(expected) {
      var descriptions = new Array(expected.length),
          i, j;

      for (i = 0; i < expected.length; i++) {
        descriptions[i] = describeExpectation(expected[i]);
      }

      descriptions.sort();

      if (descriptions.length > 0) {
        for (i = 1, j = 1; i < descriptions.length; i++) {
          if (descriptions[i - 1] !== descriptions[i]) {
            descriptions[j] = descriptions[i];
            j++;
          }
        }
        descriptions.length = j;
      }

      switch (descriptions.length) {
        case 1:
          return descriptions[0];

        case 2:
          return descriptions[0] + " or " + descriptions[1];

        default:
          return descriptions.slice(0, -1).join(", ")
            + ", or "
            + descriptions[descriptions.length - 1];
      }
    }

    function describeFound(found) {
      return found ? "\"" + literalEscape(found) + "\"" : "end of input";
    }

    return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
  };

  function peg$parse(input, options) {
    options = options !== void 0 ? options : {};

    var peg$FAILED = {},

        peg$startRuleIndices = { Root: 0 },
        peg$startRuleIndex   = 0,

        peg$consts = [
          "(0x",
          peg$literalExpectation("(0x", false),
          ")",
          peg$literalExpectation(")", false),
          function(addr, props) {
             if (addr)
               props['address'] = addr[1]
             return props
           },
          function(items) {
              return Properties(map(items, 0));
            },
          "[",
          peg$literalExpectation("[", false),
          "]",
          peg$literalExpectation("]", false),
          function(key, value) {
              return { key: key, value: value };
            },
          /^[ A-Za-z0-9_\-]/,
          peg$classExpectation([" ", ["A", "Z"], ["a", "z"], ["0", "9"], "_", "-"], false, false),
          function() {
              return text().replace(/[- ]/, '_');
            },
          "=",
          peg$literalExpectation("=", false),
          function(v) {
              return v;
            },
          "{",
          peg$literalExpectation("{", false),
          "}",
          peg$literalExpectation("}", false),
          function(r) {
              return { key: "eventRegions", value: new EventRegions(map(r, 0)) };
            },
          "animations with id=",
          peg$literalExpectation("animations with id=", false),
          function(n, p) {
              return { key: "animations", count: n, id: p };
            },
          function(key, region) {
              return { key: key, value: region };
            },
          "isFixedPosition",
          peg$literalExpectation("isFixedPosition", false),
          function(props) {
              return { key: "isFixedPosition", value: new FixedPosition(props) };
            },
          function(pairs) {
              var items = {}
              for (var i = 0; i < pairs.length; i++)
                items[pairs[i][0]] = pairs[i][2] || true;
              return items;
            },
          peg$otherExpectation("region"),
          "<",
          peg$literalExpectation("<", false),
          ";",
          peg$literalExpectation(";", false),
          ">",
          peg$literalExpectation(">", false),
          function(r) {
              return new Region(map(r, 0));
            },
          peg$otherExpectation("rect"),
          "(",
          peg$literalExpectation("(", false),
          ",",
          peg$literalExpectation(",", false),
          function(p, s) {
              return new Rect(p.x, p.y, s.w, s.h);
            },
          "x",
          peg$literalExpectation("x", false),
          "y",
          peg$literalExpectation("y", false),
          function(x, y) {
              return { x: x, y: y };
            },
          "w",
          peg$literalExpectation("w", false),
          "h",
          peg$literalExpectation("h", false),
          function(w, h) {
              return { w: w, h: h };
            },
          peg$otherExpectation("matrix3d"),
          function(r1, r2, r3, r4) {
              return new Matrix3D([r1, r2, r3, r4]);
            },
          peg$otherExpectation("matrix2d"),
          function(r1, r2, r3) {
              return new Matrix2D([r1, r2, r3]);
            },
          function(a1, a2) {
              return [a1, a2];
            },
          function(a1, a2, a3, a4) {
              return [a1, a2, a3, a4];
            },
          peg$otherExpectation("metrics"),
          function(p) {
              return new Metrics(p);
            },
          peg$otherExpectation("point"),
          function(x, y) {
              return new Point(x, y);
            },
          peg$otherExpectation("color"),
          "rgba",
          peg$literalExpectation("rgba", false),
          function(r, g, b, a) {
              return new Color(r, g, b, a);
            },
          peg$otherExpectation("scale"),
          function(x, y) {
              return new Scale(x, y);
            },
          peg$otherExpectation("float"),
          /^[\-+]/,
          peg$classExpectation(["-", "+"], false, false),
          /^[0-9]/,
          peg$classExpectation([["0", "9"]], false, false),
          /^[.]/,
          peg$classExpectation(["."], false, false),
          "e",
          peg$literalExpectation("e", false),
          /^[\-]/,
          peg$classExpectation(["-"], false, false),
          function() { return parseFloat(text()); },
          peg$otherExpectation("integer"),
          function() { return parseInt(text(), 10); },
          peg$otherExpectation("pointer"),
          /^[A-Fa-f0-9]/,
          peg$classExpectation([["A", "F"], ["a", "f"], ["0", "9"]], false, false),
          function() { return new Pointer(text().toLowerCase()); },
          "(null)",
          peg$literalExpectation("(null)", false),
          function() { return new Pointer("null"); },
          peg$otherExpectation("whitespace"),
          /^[ \t\n\r]/,
          peg$classExpectation([" ", "\t", "\n", "\r"], false, false),
          peg$otherExpectation("required space"),
          /^[ \t]/,
          peg$classExpectation([" ", "\t"], false, false)
        ],

        peg$bytecode = [
          peg$decode("%;=/q#%2 \"\"6 7!/;#;</2$2\"\"\"6\"7#/#$+#)(#'#(\"'#&'#.\" &\"/;$;=/2$;!/)$8$:$$\"\" )($'#(#'#(\"'#&'#"),
          peg$decode("%$%;\"/,#;=/#$+\")(\"'#&'#06*%;\"/,#;=/#$+\")(\"'#&'#&/' 8!:%!! )"),
          peg$decode(";)./ &;'.) &;#.# &;&"),
          peg$decode("%2&\"\"6&7'/a#;=/X$;$/O$;=/F$;%.\" &\"/8$2(\"\"6(7)/)$8&:*&\"#!)(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%$4+\"\"5!7,/,#0)*4+\"\"5!7,&&&#/& 8!:-! )"),
          peg$decode("%2.\"\"6.7//:#;=/1$;+/($8#:0#! )(#'#(\"'#&'#"),
          peg$decode("%21\"\"6172/\x7F#;=/v$$%;(/,#;=/#$+\")(\"'#&'#06*%;(/,#;=/#$+\")(\"'#&'#&/@$;=/7$23\"\"6374/($8%:5%!\")(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%2&\"\"6&7'/t#;=/k$;;/b$;=/Y$26\"\"6677/J$;</A$;=/8$2(\"\"6(7)/)$8(:8(\"%\")(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;$/S#;=/J$2.\"\"6.7//;$;=/2$;,/)$8%:9%\"$ )(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%2&\"\"6&7'/j#;=/a$2:\"\"6:7;/R$;=/I$;*/@$;=/7$2(\"\"6(7)/($8':<'!\")(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%$%;$/C#;=/:$;%.\" &\"/,$;=/#$+$)($'#(#'#(\"'#&'#0M*%;$/C#;=/:$;%.\" &\"/,$;=/#$+$)($'#(#'#(\"'#&'#&/' 8!:=!! )"),
          peg$decode(";-.M &;1.G &;0.A &;5.; &;6.5 &;4./ &;,.) &;7.# &;8"),
          peg$decode("<%2?\"\"6?7@/\xA6#;=/\x9D$$%;-/D#;=/;$2A\"\"6A7B/,$;=/#$+$)($'#(#'#(\"'#&'#0N*%;-/D#;=/;$2A\"\"6A7B/,$;=/#$+$)($'#(#'#(\"'#&'#&/7$2C\"\"6C7D/($8$:E$!!)($'#(#'#(\"'#&'#=.\" 7>"),
          peg$decode("<%2G\"\"6G7H/}#;=/t$;./k$;=/b$2I\"\"6I7J/S$;=/J$;//A$;=/8$2\"\"\"6\"7#/)$8):K)\"&\")()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#=.\" 7F"),
          peg$decode("%2L\"\"6L7M/\xAD#;=/\xA4$2.\"\"6.7//\x95$;=/\x8C$;9/\x83$;=/z$2I\"\"6I7J/k$;=/b$2N\"\"6N7O/S$;=/J$2.\"\"6.7//;$;=/2$;9/)$8-:P-\"( )(-'#(,'#(+'#(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%2Q\"\"6Q7R/\xAD#;=/\xA4$2.\"\"6.7//\x95$;=/\x8C$;9/\x83$;=/z$2I\"\"6I7J/k$;=/b$2S\"\"6S7T/S$;=/J$2.\"\"6.7//;$;=/2$;9/)$8-:U-\"( )(-'#(,'#(+'#(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("<%2&\"\"6&7'/\x8B#;=/\x82$;3/y$;=/p$;3/g$;=/^$;3/U$;=/L$;3/C$;=/:$2(\"\"6(7)/+$8+:W+$(&$\")(+'#(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#=.\" 7V"),
          peg$decode("<%2&\"\"6&7'/x#;=/o$;2/f$;=/]$;2/T$;=/K$;2/B$;=/9$2(\"\"6(7)/*$8):Y)#&$\")()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#=.\" 7X"),
          peg$decode("%;9/S#;>/J$;9/A$;=/8$2A\"\"6A7B/)$8%:Z%\"$\")(%'#($'#(#'#(\"'#&'#"),
          peg$decode("%;9/y#;>/p$;9/g$;>/^$;9/U$;>/L$;9/C$;=/:$2A\"\"6A7B/+$8):[)$(&$\")()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
          peg$decode("<%21\"\"6172/R#;=/I$;!/@$;=/7$23\"\"6374/($8%:]%!\")(%'#($'#(#'#(\"'#&'#=.\" 7\\"),
          peg$decode("<%2G\"\"6G7H/}#;=/t$;9/k$;=/b$2I\"\"6I7J/S$;=/J$;9/A$;=/8$2\"\"\"6\"7#/)$8):_)\"&\")()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#=.\" 7^"),
          peg$decode("<%2a\"\"6a7b/\xE2#2G\"\"6G7H/\xD3$;=/\xCA$;9/\xC1$;=/\xB8$2I\"\"6I7J/\xA9$;=/\xA0$;9/\x97$;=/\x8E$2I\"\"6I7J/\x7F$;=/v$;9/m$;=/d$2I\"\"6I7J/U$;=/L$;9/C$;=/:$2\"\"\"6\"7#/+$82:c2$.*&\")(2'#(1'#(0'#(/'#(.'#(-'#(,'#(+'#(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#=.\" 7`"),
          peg$decode("<%;9/S#;=/J$2I\"\"6I7J/;$;=/2$;9/)$8%:e%\"$ )(%'#($'#(#'#(\"'#&'#=.\" 7d"),
          peg$decode(";:.) &;<.# &;;"),
          peg$decode(";:.# &;;"),
          peg$decode("<%4g\"\"5!7h.\" &\"/\xCE#$4i\"\"5!7j/,#0)*4i\"\"5!7j&&&#/\xAC$4k\"\"5!7l/\x9D$$4i\"\"5!7j/,#0)*4i\"\"5!7j&&&#/{$%2m\"\"6m7n/Y#4o\"\"5!7p.\" &\"/E$$4i\"\"5!7j/,#0)*4i\"\"5!7j&&&#/#$+#)(#'#(\"'#&'#.\" &\"/'$8%:q% )(%'#($'#(#'#(\"'#&'#=.\" 7f"),
          peg$decode("<%4g\"\"5!7h.\" &\"/I#$4i\"\"5!7j/,#0)*4i\"\"5!7j&&&#/'$8\":s\" )(\"'#&'#=.\" 7r"),
          peg$decode("<%$4u\"\"5!7v/,#0)*4u\"\"5!7v&&&#/& 8!:w! ).4 &%2x\"\"6x7y/& 8!:z! )=.\" 7t"),
          peg$decode("<$4|\"\"5!7}0)*4|\"\"5!7}&=.\" 7{"),
          peg$decode("<4\x7F\"\"5!7\x80=.\" 7~")
        ],

        peg$currPos          = 0,
        peg$savedPos         = 0,
        peg$posDetailsCache  = [{ line: 1, column: 1 }],
        peg$maxFailPos       = 0,
        peg$maxFailExpected  = [],
        peg$silentFails      = 0,

        peg$result;

    if ("startRule" in options) {
      if (!(options.startRule in peg$startRuleIndices)) {
        throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
      }

      peg$startRuleIndex = peg$startRuleIndices[options.startRule];
    }

    function text() {
      return input.substring(peg$savedPos, peg$currPos);
    }

    function location() {
      return peg$computeLocation(peg$savedPos, peg$currPos);
    }

    function expected(description, location) {
      location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos)

      throw peg$buildStructuredError(
        [peg$otherExpectation(description)],
        input.substring(peg$savedPos, peg$currPos),
        location
      );
    }

    function error(message, location) {
      location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos)

      throw peg$buildSimpleError(message, location);
    }

    function peg$literalExpectation(text, ignoreCase) {
      return { type: "literal", text: text, ignoreCase: ignoreCase };
    }

    function peg$classExpectation(parts, inverted, ignoreCase) {
      return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
    }

    function peg$anyExpectation() {
      return { type: "any" };
    }

    function peg$endExpectation() {
      return { type: "end" };
    }

    function peg$otherExpectation(description) {
      return { type: "other", description: description };
    }

    function peg$computePosDetails(pos) {
      var details = peg$posDetailsCache[pos], p;

      if (details) {
        return details;
      } else {
        p = pos - 1;
        while (!peg$posDetailsCache[p]) {
          p--;
        }

        details = peg$posDetailsCache[p];
        details = {
          line:   details.line,
          column: details.column
        };

        while (p < pos) {
          if (input.charCodeAt(p) === 10) {
            details.line++;
            details.column = 1;
          } else {
            details.column++;
          }

          p++;
        }

        peg$posDetailsCache[pos] = details;
        return details;
      }
    }

    function peg$computeLocation(startPos, endPos) {
      var startPosDetails = peg$computePosDetails(startPos),
          endPosDetails   = peg$computePosDetails(endPos);

      return {
        start: {
          offset: startPos,
          line:   startPosDetails.line,
          column: startPosDetails.column
        },
        end: {
          offset: endPos,
          line:   endPosDetails.line,
          column: endPosDetails.column
        }
      };
    }

    function peg$fail(expected) {
      if (peg$currPos < peg$maxFailPos) { return; }

      if (peg$currPos > peg$maxFailPos) {
        peg$maxFailPos = peg$currPos;
        peg$maxFailExpected = [];
      }

      peg$maxFailExpected.push(expected);
    }

    function peg$buildSimpleError(message, location) {
      return new peg$SyntaxError(message, null, null, location);
    }

    function peg$buildStructuredError(expected, found, location) {
      return new peg$SyntaxError(
        peg$SyntaxError.buildMessage(expected, found),
        expected,
        found,
        location
      );
    }

    function peg$decode(s) {
      var bc = new Array(s.length), i;

      for (i = 0; i < s.length; i++) {
        bc[i] = s.charCodeAt(i) - 32;
      }

      return bc;
    }

    function peg$parseRule(index) {
      var bc    = peg$bytecode[index],
          ip    = 0,
          ips   = [],
          end   = bc.length,
          ends  = [],
          stack = [],
          params, i;

      while (true) {
        while (ip < end) {
          switch (bc[ip]) {
            case 0:
              stack.push(peg$consts[bc[ip + 1]]);
              ip += 2;
              break;

            case 1:
              stack.push(void 0);
              ip++;
              break;

            case 2:
              stack.push(null);
              ip++;
              break;

            case 3:
              stack.push(peg$FAILED);
              ip++;
              break;

            case 4:
              stack.push([]);
              ip++;
              break;

            case 5:
              stack.push(peg$currPos);
              ip++;
              break;

            case 6:
              stack.pop();
              ip++;
              break;

            case 7:
              peg$currPos = stack.pop();
              ip++;
              break;

            case 8:
              stack.length -= bc[ip + 1];
              ip += 2;
              break;

            case 9:
              stack.splice(-2, 1);
              ip++;
              break;

            case 10:
              stack[stack.length - 2].push(stack.pop());
              ip++;
              break;

            case 11:
              stack.push(stack.splice(stack.length - bc[ip + 1], bc[ip + 1]));
              ip += 2;
              break;

            case 12:
              stack.push(input.substring(stack.pop(), peg$currPos));
              ip++;
              break;

            case 13:
              ends.push(end);
              ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);

              if (stack[stack.length - 1]) {
                end = ip + 3 + bc[ip + 1];
                ip += 3;
              } else {
                end = ip + 3 + bc[ip + 1] + bc[ip + 2];
                ip += 3 + bc[ip + 1];
              }

              break;

            case 14:
              ends.push(end);
              ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);

              if (stack[stack.length - 1] === peg$FAILED) {
                end = ip + 3 + bc[ip + 1];
                ip += 3;
              } else {
                end = ip + 3 + bc[ip + 1] + bc[ip + 2];
                ip += 3 + bc[ip + 1];
              }

              break;

            case 15:
              ends.push(end);
              ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);

              if (stack[stack.length - 1] !== peg$FAILED) {
                end = ip + 3 + bc[ip + 1];
                ip += 3;
              } else {
                end = ip + 3 + bc[ip + 1] + bc[ip + 2];
                ip += 3 + bc[ip + 1];
              }

              break;

            case 16:
              if (stack[stack.length - 1] !== peg$FAILED) {
                ends.push(end);
                ips.push(ip);

                end = ip + 2 + bc[ip + 1];
                ip += 2;
              } else {
                ip += 2 + bc[ip + 1];
              }

              break;

            case 17:
              ends.push(end);
              ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);

              if (input.length > peg$currPos) {
                end = ip + 3 + bc[ip + 1];
                ip += 3;
              } else {
                end = ip + 3 + bc[ip + 1] + bc[ip + 2];
                ip += 3 + bc[ip + 1];
              }

              break;

            case 18:
              ends.push(end);
              ips.push(ip + 4 + bc[ip + 2] + bc[ip + 3]);

              if (input.substr(peg$currPos, peg$consts[bc[ip + 1]].length) === peg$consts[bc[ip + 1]]) {
                end = ip + 4 + bc[ip + 2];
                ip += 4;
              } else {
                end = ip + 4 + bc[ip + 2] + bc[ip + 3];
                ip += 4 + bc[ip + 2];
              }

              break;

            case 19:
              ends.push(end);
              ips.push(ip + 4 + bc[ip + 2] + bc[ip + 3]);

              if (input.substr(peg$currPos, peg$consts[bc[ip + 1]].length).toLowerCase() === peg$consts[bc[ip + 1]]) {
                end = ip + 4 + bc[ip + 2];
                ip += 4;
              } else {
                end = ip + 4 + bc[ip + 2] + bc[ip + 3];
                ip += 4 + bc[ip + 2];
              }

              break;

            case 20:
              ends.push(end);
              ips.push(ip + 4 + bc[ip + 2] + bc[ip + 3]);

              if (peg$consts[bc[ip + 1]].test(input.charAt(peg$currPos))) {
                end = ip + 4 + bc[ip + 2];
                ip += 4;
              } else {
                end = ip + 4 + bc[ip + 2] + bc[ip + 3];
                ip += 4 + bc[ip + 2];
              }

              break;

            case 21:
              stack.push(input.substr(peg$currPos, bc[ip + 1]));
              peg$currPos += bc[ip + 1];
              ip += 2;
              break;

            case 22:
              stack.push(peg$consts[bc[ip + 1]]);
              peg$currPos += peg$consts[bc[ip + 1]].length;
              ip += 2;
              break;

            case 23:
              stack.push(peg$FAILED);
              if (peg$silentFails === 0) {
                peg$fail(peg$consts[bc[ip + 1]]);
              }
              ip += 2;
              break;

            case 24:
              peg$savedPos = stack[stack.length - 1 - bc[ip + 1]];
              ip += 2;
              break;

            case 25:
              peg$savedPos = peg$currPos;
              ip++;
              break;

            case 26:
              params = bc.slice(ip + 4, ip + 4 + bc[ip + 3]);
              for (i = 0; i < bc[ip + 3]; i++) {
                params[i] = stack[stack.length - 1 - params[i]];
              }

              stack.splice(
                stack.length - bc[ip + 2],
                bc[ip + 2],
                peg$consts[bc[ip + 1]].apply(null, params)
              );

              ip += 4 + bc[ip + 3];
              break;

            case 27:
              stack.push(peg$parseRule(bc[ip + 1]));
              ip += 2;
              break;

            case 28:
              peg$silentFails++;
              ip++;
              break;

            case 29:
              peg$silentFails--;
              ip++;
              break;

            default:
              throw new Error("Invalid opcode: " + bc[ip] + ".");
          }
        }

        if (ends.length > 0) {
          end = ends.pop();
          ip = ips.pop();
        } else {
          break;
        }
      }

      return stack[0];
    }


      function map(list, index) {
        var out = [];
        for (var i = 0; i < list.length; i++)
          out.push(list[i][index]);
        return out;
      }

      function Point(x, y) {
        this.x = x;
        this.y = y;
      }
      Point.prototype.type = 'point';

      function Rect(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
      }

      Rect.prototype.type = 'rect';

      function Color(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
      }
      Color.prototype.type = 'color';

      function Region(rects) {
        this.rects = rects;
      }
      Region.prototype.type = 'region';

      function Metrics(props) {
        this.props = props;
      }
      Metrics.prototype.type = 'metrics';
      Metrics.prototype.complex = true;

      function Matrix2D(rows) {
        this.rows = rows;
      }
      Matrix2D.prototype.type = 'matrix2d';

      function Matrix3D(rows) {
        this.rows = rows;
      }
      Matrix3D.prototype.type = 'matrix3d';

      function Pointer(x) {
        this.value = x;
      }
      Pointer.prototype.type = 'pointer';

      function FixedPosition(props) {
        this.props = props;
      }
      FixedPosition.prototype.type = 'fixedpos';
      FixedPosition.prototype.complex = true;

      function EventRegions(props) {
        this.props = Properties(props);
      }
      EventRegions.prototype.type = 'eventregions';
      EventRegions.prototype.complex = true;

      function Scale(x, y) {
        this.xScale = x;
        this.yScale = y;
      }
      Scale.prototype.type = 'scale';

      function Properties(list) {
        var obj = {};
        for (var i = 0; i < list.length; i++)
          obj[list[i].key] = list[i].value || true;
        return obj;
      }


    peg$result = peg$parseRule(peg$startRuleIndex);

    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
      return peg$result;
    } else {
      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
        peg$fail(peg$endExpectation());
      }

      throw peg$buildStructuredError(
        peg$maxFailExpected,
        peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
        peg$maxFailPos < input.length
          ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
          : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
      );
    }
  }

  return {
    SyntaxError: peg$SyntaxError,
    parse:       peg$parse
  };
})();
