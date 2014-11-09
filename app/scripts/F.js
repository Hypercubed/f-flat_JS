/*jslint evil: true */

(function() {
  'use strict';

  var global = this;

  var is = {
    Array: Array.isArray,
    Boolean: function(value) {
      return typeof value === 'boolean';
    }
  }

  function eql(a,b) {
    if (a == b) {return true;}
    if (a === null || b === null) {return false;}
    if (a !== a && b !== b) {return true;}
    if (a instanceof Array && b instanceof Array) {
      if (a.length === b.length) {
        for (var i=0; i<a.length; i++) {
          if (!eql(a[i],b[i])) {return false;}
        }
        return true;
      }
    }
    if (a instanceof Command && b instanceof Command) {
      return a.command === b.command;
    }
    return false;
  }

  function gamma(n) {  // accurate to about 15 decimal places
    //some magic constants
    var g = 7, // g represents the precision desired, p is the values of p[i] to plug into Lanczos' formula
        p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if(n < 0.5) {
      return Math.PI / Math.sin(n * Math.PI) / gamma(1 - n);
    }
    else {
      n--;
      var x = p[0];
      for(var i = 1; i < g + 2; i++) {
        x += p[i] / (n + i);
      }
      var t = n + g + 0.5;
      return Math.sqrt(2 * Math.PI) * Math.pow(t, (n + 0.5)) * Math.exp(-t) * x;
    }
  }

  function erf(x) {
    if(x<4.58918682993e-8 && x>-4.58918682993e-8)
      {return x*2;}
      // Chebyshev approx, alg by Thomas Meyer
    var t,z,ret;
    z=Math.abs(x);
    t=1/(1+0.5*z);
    ret=t*Math.exp(-z*z-1.26551223+t*
      ( 1.00002368 + t *
      ( 0.37409196 + t *
      ( 0.09678418 + t *
      ( -0.18628806 + t *
      ( 0.27886807 + t *
      ( -1.13520398 + t *
      ( 1.48851587 + t *
      ( -0.82215223 + t *
      	0.1708727 ) ) ) ) ) ) ) ) );
    return x<0?ret-1:1-ret;
  }

  function pluck(context, path) {
    var pathParts = path.split('.');

    for (var i = 0, ii = pathParts.length; i < ii; i++) {
      if (!context) {break;}
      context = context[pathParts[i]];
    }

    return context;
  }

  function copy(src) {
    if (src instanceof Array) {
      return JSON.parse(JSON.stringify(src));
    }
    return src;
  }

  function Command(string) {
    this.command = string;
  }

  Command.prototype.toString = function() {
    return this.command;
  };

  function F(s) {
    this.depth = 0;
    this.q = [];
    this.dict = {};

    this.define({
      '+': function(lhs,rhs) {
            if (is.Array(lhs) && is.Array(rhs)) {  //concat
              return lhs.concat(rhs);
            }
            if (is.Boolean(rhs) && is.Boolean(lhs)) {  // boolean or
              return lhs || rhs;
            }
            return lhs + rhs;
          },
      '-': function(lhs,rhs) {
            if (is.Boolean(rhs) && is.Boolean(lhs)) { // boolean xor
              return ( lhs || rhs ) && !( lhs && rhs );
            }
            return lhs - rhs;
          },
      '*': function(lhs,rhs) {
            if (is.Boolean(rhs) && is.Boolean(lhs)) { // boolean and
              return ( lhs && rhs );
            }
            if (typeof lhs === 'string' && typeof rhs === 'number') {
              return new Array( rhs + 1 ).join( lhs );
            }
            if (is.Array(lhs) && typeof rhs === 'string') {  // string join
              return lhs.join( rhs );
            }
            if (is.Array(lhs) && is.Array(rhs)) {
              var l = [];
              for(var i = 0; i < lhs.length; i++) {
                l.push(lhs[i]);
                l = l.concat(rhs);
              }
              return l;
            }
            if (is.Array(lhs) && typeof rhs === 'number') {
              if (rhs === 0) {return [];}
              var a = [];
              var len = lhs.length*rhs;
              while (a.length < len) {a = a.concat(lhs);}
              return a;
            }
            return lhs * rhs;
          },
      '/': function(lhs,rhs) {
          if (is.Boolean(rhs) && is.Boolean(lhs)) {  // boolean nand
            return !( lhs && rhs );
          }
          if (typeof lhs === 'string' && typeof rhs === 'string') {  // string split
            return lhs.split( rhs );
          }
          if ((typeof lhs === 'string' || is.Array(lhs)) && typeof rhs === 'number') {  // string split
            var len = lhs.length/rhs;
            return lhs.slice( 0, len );
          }
          return lhs / rhs;
        },
      '{': function() {
            var s = this.splice(0);
            this.q.push(s);
          },
      '}': function() {
            var s = this.splice(0);
            var r = this.q.pop();
            this.push.apply(this,r);
            return s;
          },
      '[': function() {
            var s = this.splice(0);
            this.q.push(s);
            this.depth++;
          },
      ']': function() {
            var s = this.splice(0);
            var r = this.q.pop();
            this.push.apply(this,r);
            this.depth = Math.max(0,this.depth - 1);
            return s;
          },
      /* 'join': function(lhs,rhs) {
        if (typeof rhs === 'string') {
          return lhs.join(rhs);
        }
        var l = [];
        for(var i = 0; i < lhs.length; i++) {
          l.push(lhs[i]);
          l = l.concat(rhs);
        }
        return l;
      }, */
      '>>': function(lhs,rhs) {
        rhs.unshift(lhs);
        return rhs;
      },
      '<<': function(lhs,rhs) {
        lhs.push(rhs);
        return lhs;
      },

    });

    this
      //.define('/', function(lhs,rhs) { return lhs / rhs; })
      .define('%', function(lhs,rhs) { return lhs % rhs; })
      .define('>', function(lhs,rhs) { return lhs > rhs; })
      .define('<', function(lhs,rhs) { return lhs < rhs; })
      .define('=', eql);

    this
      .define('depth',   function () { return this.length; })
      .define('stack',   function () { return this.splice(0); })
      .define('unstack', function (s) {
        this.clr();
        this.push.apply(this,s);
      })
      .define('in', function (a) {
        var r = this.splice(0);
        this.eval(a);
        var s = this.splice(0);
        this.push.apply(this,r);
        this.push(s);
      });

    this
      .define('drop',   function () { this.pop(); })
      .define('swap',   function (a,b) { this.push(b); return a; })
      .define('dup',    function () { return copy(this[this.length-1]); })
      .define('sto',    function (lhs,rhs) { this.dict[rhs] = lhs; })
      .define('def',    function (cmd,name) {
        if(typeof cmd !== 'function') {
          cmd =
            (cmd instanceof Command) ?
            new Command(cmd.command) :
            new Command(cmd);
        }
        this.dict[name] = cmd;
      })
      .define('delete', function (a) { delete this.dict[a]; })
      .define('type',   function (a) { return typeof a; })
      .define('rcl',    function (a) { return this.lookup(a); })
      .define('see',    function (a) { return this.lookup(a).toString(); })
      .define('eval',   function (a) { this.eval(a); })
      .define('clr',    F.prototype.clr)

      .define('>r',     function (a) { this.q.push(a); })
      .define('<r',     function () { return this.q.pop(); })
      .define('choose', function (b,t,f) { return b ? t : f; });

    this
      .define('Math', Math)
      .define(Math.abs)
      .define(Math.cos)
      .define(Math.sin)
      .define(Math.tan)
      .define(Math.acos)
      .define(Math.asin)
      .define(Math.atan)
      .define(Math.atan2)
      .define(Math.round)
      .define(Math.floor)
      .define(Math.ceil)
      .define(Math.sqrt)
      .define(Math.max)
      .define(Math.min)
      .define('^', Math.pow)
      .define('rand', Math.random);

    this.define({
      'e': Math.E,               // returns Euler's number
      'pi': Math.PI,             // returns PI
      'tau': 2*Math.PI,
      'sqrt2': Math.SQRT2,       // returns the square root of 2
      'sqrt1_2': Math.SQRT1_2,   // returns the square root of 1/2
      'ln2': Math.LN2,           // returns the natural logarithm of 2
      'ln10': Math.LN10,         // returns the natural logarithm of 10
      'log2e': Math.LOG2E,       // returns base 2 logarithm of E
      'log10e': Math.LOG10E      // returns base 10 logarithm of E
    });

    this.define({
      'toRadians': 'pi 180 / *',
      'toDegrees': '180 pi / *'
    });

    this
      .define('String', String)
      .define('Number', Number)
      .define('Boolean', Number);

    this
      .define('log',    'ln ln10 /' )
      .define('ln',     Math.log)
      .define('gamma',  gamma)
      .define('erf',    erf)
      .define('erfc',    '1 swap erf -')
      .define('null',   function() { return null; });

    this.define('length', function (a) { return a.length; });
    this.define('pluck', pluck);
    this.define('pop', function () { return this[this.length-1].pop(); });  // These should probabbly leave the array and the return value
    this.define('shift', function () { return this[this.length-1].shift(); });
    this.define('slice', function (a,b,c) { return a.slice(b,c); });
    this.define('splice', function (a,b,c) { return a.splice(b,c); });
    //this.define('split', function (a,b) { return a.split(b); });
    this.define('at', function (a,b) {
      if (typeof a === 'string') {
        a = a.split('');
      }
      return a.splice(b,1);
    });
    this.define('throw',  F.prototype.throw);

    this.define('clock', function clock() { return (new Date()).getTime(); });

    // experimental
    this.define('print', function (a) { console.log(a); });
    this.define('?', function (a) { console.info(a); });
    this.define('alert', function (a) { window.alert(a); });
    this.define('$global', global);
    this.define('$', function (a) { return global.$(a); });
    this.define('JSON.stringify', function (a) { return JSON.stringify(a); });
    this.define('JSON.parse', function (a) { return JSON.parse(a); });
    this.define('call', function (a,b) { return a.call(this,b); });
    this.define('apply', function (a,b) { return a.apply(this,b); });
    this.define('$timeout', function (a,b) {
      var self = this;
      setTimeout(function() {
        self.eval(a);
      },b);
    });
    this.define('jsDef', '#jsFunc dip def');
    this.define('jsFunc', function(rhs) {
      eval.call(this,'var fn = '+rhs);
      return fn;
    });
    this.define('blob', function(b,t) {
      if (!(is.Array(b))) {
        b = [b];
      }
      this.push(new Blob([b], {type : t}));
    });
    this.define('httpGet', function(url) {
      var stack = this;
      var xhr = new XMLHttpRequest();
      xhr.onload = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            stack.push(xhr.responseText);
          } else {
            console.error(xhr.statusText);
          }
        }
      };
      xhr.onerror = function () {
        console.error(xhr.statusText);
      };
      xhr.open('GET', url, false);
      xhr.send(null);
    });

    this.define({
      'slip':   '>r eval <r',
      'dip':    'swap slip',
      'cleave': '[ keep ] dip eval',
      'keep':   'over slip',
      'dupd':   '[ dup ] dip',
      'dropd':   '[ drop ] dip',
      'over':   'dupd swap',
      '--':     '1 -',
      '++':     '1 +',
      'pred':   'dup --',
      'succ':   'dup ++',
      'times':  '* eval',
      'upto':   'over - [ succ ] swap times',
      'count':  '1 swap upto',
      '!':      'dup 25 < [ pred [ count ] dip [ * ] swap times ] [ ++ gamma ] branch',
      'npr':    '[ [ ! ] keep ] dip - ! /',
      'ncr':    '[ npr ] keep ! / round',
      'branch': 'choose eval',
      'dipd':   '[ dip ] dip',
      'ifte':   '[ eval ] dipd branch',
      'if':     '[ ] ifte',
      '^^^':     '[ dup [ swap ^^ ] >> ] dip -- times',
      '^^':     '[ dup [ swap ^ ] >> ] dip -- times',
      'time':   'clock swap 100 times clock swap - 100 /',
      'reduce': '[ * ] >> dip swap eval',
      'sum':    '0 [ + ] reduce',
      'map':    '* in',
      'product': '1 [ * ] reduce',
      'first':  'pop dropd',
      'last':   'shift dropd',
    });

    if (s) { this.eval(s); }

  }

  F.prototype = [];

  F.prototype.define = function (name, fn) {
    var key;
    if (typeof name === 'object') {
      for (key in name) {
        if (name.hasOwnProperty(key)) {
          this.define(key, name[key]);
        }
      }
    } else {
      if (arguments.length === 1) {
        fn = name;
        name = fn.name;
      }
      if (typeof fn === 'string') {
        fn = new Command(fn);
      }
      this.dict[name] = fn;
    }
    return this;
  };

  F.prototype.lexer = function(text) {
    if (!text || text.length < 1) { return []; }

    var tokens = [];
    var token = '';
    var index = 0;
    var len = text.length;

    while (index < len) {
      var ch = text.charAt(index++);
      var nch = text.charAt(index);

      if (isWhitespace(ch)) {
        pushToken();
      } else if (isQuote(ch)) {
        tokens.push(scanString(ch));
      } else if (ch === '/' && nch === '*') {
        scanString('*/');
      } else if (ch === '/' && nch === '/') {
        scanString('\n');
      } else if (isBracket(ch) || isBracket(nch) || index === len) {
        token += ch;
        pushToken();
      } else {
        token += ch;
      }

    }

    return tokens;

    function scanString(lch) {
      var token = '';
      var ll = lch.length;
      var nch;

      while (index < text.length && nch !== lch) {
        token += text[index++];
        nch = text.substring(index,index+ll);
      }
      index += ll;

      return token;
    }

    function isWhitespace(ch) {
      return (ch === ' ' || ch === '\r' || ch === '\t' ||
              ch === '\n' || ch === '\v' || ch === '\u00A0' ||
              ch === ',' );
    }

    function isQuote(ch) {
      return (ch === '"' || ch === '\'');
    }

    function isBracket(ch) {
      return (ch === '{' || ch === '}' ||
              ch === '[' || ch === ']');
    }

    function isNumeric(num){
      return !isNaN(num);
    }

    function isBoolean(string){
      var lc = string.toLowerCase();
      return lc === 'true' || lc === 'false';
    }

    function pushToken(t) {
      if (t === undefined && token.length > 0) {
        t = toLiteral(token);
      }
      if (token.length > 0) {
        tokens.push(t);
        token = '';
      }
    }

    function toLiteral(d) {
      if (isNumeric(d)) {
        return +d;
      } else if (isBoolean(d)) {
        return d.toLowerCase() === 'true';
      }
      return new Command(d);
    }

  };

  F.prototype.lookup = function(path) {
    return pluck(this.dict, path);
  };

  F.prototype.eval = function(s) {
    var stack = this;

    var ss = s;
    if (is.Array(ss)) { ss = ss.slice(0); }
    if (ss instanceof Command) { ss = [ ss ]; }
    if (typeof ss === 'string') { ss = this.lexer(ss); }

    var len = ss.length;
    for (var i = 0; i < len; ++i) {
      var c = ss[i];

      if (c instanceof Command && (stack.depth < 1 || '[]'.indexOf(c.command) > -1 )) {
        if (c.command.charAt(0) === '#') {
          c = new Command(c.command.slice(1));
          stack.push(c);
        } else {
          var d = stack.lookup(c.command);
          if (d instanceof Command) {
            stack.eval(d.command);
          } else if (d instanceof Function) {
            var args = d.length > 0 ? stack.splice(-d.length) : [];
            var r = d.apply(stack, args);
            if (r !== undefined) {
              stack.push(r);
            }
          } else if (d) {
            stack.push(d);
          } else {
            stack.push(c.command);
          }
        }
      } else {
        stack.push(c);
      }

    }

    return stack;
  };

  F.prototype.clr = function() {
    while(this.length > 0) { this.pop(); }
  };

  F.prototype.throw = function(exp) {
    this.push(exp);

    var e = new Error(exp);
    console.info(e.stack);
  };

  F.Command = Command;

  this.F = F;

}).call((function() {
  'use strict';
  return this || (typeof window !== 'undefined') ? window : global;
})());
