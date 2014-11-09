/* global chai */
/* global describe */
/* global beforeEach */
/* global it */
/* global F */

/*jslint evil: true */

'use strict';

var expect = chai.expect;

describe('setup', function() {
  var f;

  beforeEach(function() {
    f = new F();
  });

  it('should create a stack object', function() {
    expect(f).to.be.an.instanceOf(Array);
    expect(f).to.be.an.instanceOf(F);
    expect(f).to.be.an('object');
    expect(f.lexer).to.be.defined;
    expect(f.eval).to.be.defined;
  });

  it('should create an empty stack', function() {
    expect(f.length).to.be.zero;
    expect(f.slice(0)).to.be.empty;
  });

  it('should create an non-empty stack', function() {
    f = new F('1 2 3');
    expect(f.length).to.equal(3);
    expect(f.slice(0)).to.be.eql([1,2,3]);
  });

  it('should be chainable', function() {
    f.eval('1').eval('2 3 10');
    expect(f.length).to.equal(4);
    expect(f.slice(0)).to.be.eql([1,2,3,10]);
  });

});

describe('numeric', function() {
  var f;

  beforeEach(function() {
    f = new F();
  });

  it('should parse', function() {
    expect(f.lexer('1')).to.eql([1]);
    expect(f.lexer('1 2')).to.eql([1,2]);
  });

  it('should push numbers', function() {
    expect(f.eval('1').slice(0)).to.eql([1]);
    expect(f.eval('2').slice(0)).to.eql([1,2]);
  });

  it('should 0x4d2 push numbers', function() {
    expect(f.eval('0x5').slice(0)).to.eql([5]);
    expect(f.eval('0x4d2').slice(0)).to.eql([5,1234]);
  });

  it('should add numbers', function() {
    expect(f.eval('1 2 +').slice(0)).to.eql([3]);
  });

  it('should sub numbers', function() {
    expect(f.eval('1 2 -').slice(0)).to.eql([-1]);
  });

  it('should multiply numbers', function() {
    expect(f.eval('1 2 *').slice(0)).to.eql([2]);
  });

  it('should divide numbers', function() {
    expect(f.eval('1 2 /').slice(0)).to.eql([0.5]);
  });

  it('should test equality', function() {
    expect(f.eval('1 2 =').slice(0)).to.eql([false]);
    expect(new F().eval('2 2 =').slice(0)).to.eql([true]);
  });

  it('should test inequality', function() {
    expect(f.eval('1 2 <').slice(0)).to.eql([true]);
    expect(new F().eval('1 2 >').slice(0)).to.eql([false]);
    expect(new F().eval('2 1 <').slice(0)).to.eql([false]);
    expect(new F().eval('2 1 >').slice(0)).to.eql([true]);
  });

});

describe('Math', function() {
  var f;

  beforeEach(function() {
    f = new F();
  });

  it('should calculate trig funcs', function() {
    expect(f.eval('1 cos 1 sin 1 tan').slice(0)).to.eql([Math.cos(1),Math.sin(1),Math.tan(1)]);
  });

  it('should calculate inv trig funcs', function() {
    expect(f.eval('1 acos 1 asin 1 atan').slice(0)).to.eql([Math.acos(1),Math.asin(1),Math.atan(1)]);
  });

  it('should calculate inv trig funcs', function() {
    expect(f.eval('1 atan 4 *').slice(0)).to.eql([Math.PI]);
  });

  it('should define constants', function() {
    expect(f.eval('e pi').slice(0)).to.eql([Math.E, Math.PI]);
  });

  it('should define logs', function() {
    expect(new F().eval('1 log 10 log 100 log').slice(0)).to.eql([0,1,2]);
    expect(new F().eval('clr 2 ln 10 ln').slice(0)).to.eql([Math.LN2,Math.LN10]);
  });

  it('should define factorial and gamma', function() {
    var tolerance = 0.5 * Math.pow(10, -9);

    expect(f.eval('20 !').slice(0)).to.eql([2432902008176640000]);

    var r = (new F()).eval('4 gamma')[0] - 6;
    expect(Math.abs(r)).to.be.lessThan(tolerance);

    r = (new F()).eval('1 2 / gamma')[0] - Math.sqrt(Math.PI);
    expect(Math.abs(r)).to.be.lessThan(tolerance);

    r = ((new F()).eval('100 !')[0] - 9.33262154e157)/9.33262154e157;
    expect(Math.abs(r)).to.be.lessThan(tolerance);
  });

  it('should do Knuth\'s up-arrow notation', function() {
    expect(f.eval('3 2 ^^^').slice(0)).to.eql([7625597484987]);
  });
});

describe('boolean', function() {
  var f;

  beforeEach(function() {
    f = new F();
  });

  it('should parse', function() {
    expect(f.lexer('true').slice(0)).to.eql([true]);
    expect(f.lexer('false').slice(0)).to.eql([false]);
  });

  it('should push booleans', function() {
    expect(f.eval('true false').slice(0)).to.eql([true,false]);
  });

  it('should or', function() {
    expect(new F().eval('true false +').slice(0)).to.eql([true]);
    expect(new F().eval('true true +').slice(0)).to.eql([true]);
    expect(new F().eval('false false +').slice(0)).to.eql([false]);
  });

  it('should xor', function() {
    expect(new F().eval('true false -').slice(0)).to.eql([true]);
    expect(new F().eval('true true -').slice(0)).to.eql([false]);
    expect(new F().eval('false false -').slice(0)).to.eql([false]);
  });

  it('should and', function() {
    expect(new F().eval('true false *').slice(0)).to.eql([false]);
    expect(new F().eval('true true *').slice(0)).to.eql([true]);
    expect(new F().eval('false false *').slice(0)).to.eql([false]);
  });

  it('should test equality', function() {
    expect(new F().eval('true false =').slice(0)).to.eql([false]);
    expect(new F().eval('true true =').slice(0)).to.eql([true]);
    expect(new F().eval('false false =').slice(0)).to.eql([true]);
  });

  it('should test equality', function() {
    expect(new F().eval('true 0 =').slice(0)).to.eql([false]);
    expect(new F().eval('true 1 =').slice(0)).to.eql([true]);
    expect(new F().eval('false 0 =').slice(0)).to.eql([true]);
    expect(new F().eval('false 1 =').slice(0)).to.eql([false]);
  });

});

describe('strings', function() {
  var f;

  beforeEach(function() {
    f = new F();
  });

  it('should parse', function() {
    expect(f.lexer('"test"').slice(0)).to.eql(['test']);
    expect(f.lexer('"test 1 2 3"').slice(0)).to.eql(['test 1 2 3']);
  });

  it('should push strings', function() {
    expect(f.eval('"a"').slice(0)).to.eql(['a']);
    expect(f.eval('"b"').slice(0)).to.eql(['a','b']);
  });

  it('should push strings', function() {
    expect(f.eval("'a'").slice(0)).to.eql(['a']);
    expect(f.eval("'b'").slice(0)).to.eql(['a','b']);
  });

  it('should push strings with spaces', function() {
    expect(f.eval('"ab de"').slice(0)).to.eql(['ab de']);
  });

  it('should push strings with nested quotes', function() {
    expect(f.eval('"ab \'de\' fg"').slice(0)).to.eql(['ab \'de\' fg']);
    expect(new F().eval("'ab \"de\" fg'").slice(0)).to.eql(['ab \"de\" fg']);
  });

  it('should add', function() {
    expect(f.eval('"a" "b" +').slice(0)).to.eql(["ab"]);
  });

  it('should multiply', function() {
    expect(f.eval('"a" 2 *').slice(0)).to.eql(["aa"]);
  });

  it('should split', function() {
    expect(f.eval('"a-b-c" "-" /').slice(0)).to.eql([['a','b','c']]);
  });

  it('should test equality', function() {
    expect(f.eval('"a" "b" =').slice(0)).to.eql([false]);
  });

  it('should test equality', function() {
    expect(f.eval('"a" "a" =').slice(0)).to.eql([true]);
  });

  it('should eval strings', function() {
    expect(f.eval('"1 2 +"').slice(0)).to.eql(['1 2 +']);
    expect(f.eval('eval').slice(0)).to.eql([3]);
  });
});

describe('lists', function() {
  var f;

  beforeEach(function() {
    f = new F();
  });

  it('should push', function() {
    expect(f.eval('{ 1 } { 2 }').slice(0)).to.eql([ [1],[2] ]);
  });

  it('should handle mssing whitespace', function() {
    expect(f.eval('{1} {2}').slice(0)).to.eql([ [1],[2] ]);
  });

  it('should eval within list', function() {
    expect(f.eval('{1} {2 3 +}').slice(0)).to.eql([ [1],[5] ]);
  });

  it('should add', function() {
    expect(f.eval('{ 1 } { 2 } +').slice(0)).to.eql([ [1,2]  ]);
  });

  it('should multiply', function() {
    expect(new F().eval('{ 1 } 2 *').slice(0)).to.eql([[1,1]]);
    expect(new F().eval('{ 1 } 3 *').slice(0)).to.eql([[1,1,1]]);
    expect(new F().eval('{ 1 2 } 2 *').slice(0)).to.eql([[1,2,1,2]]);
    expect(new F().eval('{ 1 2 + } 2 *').slice(0)).to.eql([[3,3]]);
  });

  it('should test equality', function() {
    expect(new F().eval('{ 1 2 } { 1 2 } =').slice(0)).to.eql([true]);
    expect(new F().eval('{ 1 } { 2 } =').slice(0)).to.eql([false]);
    expect(new F().eval('{ 1 2 } { 1 } =').slice(0)).to.eql([false]);
    expect(new F().eval('{ 1 2 } { 1 1 } =').slice(0)).to.eql([false]);
  });

  it('should eval lists', function() {
    expect(f.eval('{ 1 2 }').slice(0)).to.eql([[ 1, 2 ]]);
    expect(f.eval('eval').slice(0)).to.eql([1,2]);
  });

  //[ [ 1 2 3 ] [ 4 ] zip [ 1 4 2 4 3 4 ] = ] "List Zip " assert

  it('should zip lists', function() {
    expect(f.eval('{ 1 2 3 } { 4 }').slice(0)).to.eql([[ 1, 2, 3 ],[4]]);
    expect(f.eval('*').slice(0)).to.eql([[ 1, 4, 2, 4, 3, 4 ]]);
  });

  it('should join', function() {
    expect(f.eval('{ 1 2 3 } "-" *').slice(0)).to.eql(['1-2-3']);
  });

  it('should <<', function() {
    expect(f.eval('{ 1 2 3 } 4 <<').slice(0)).to.eql([[1,2,3,4]]);
  });

  it('should >>', function() {
    expect(f.eval('4 { 1 2 3 } >>').slice(0)).to.eql([[4,1,2,3]]);
  });
});

describe('quote', function() {
  var f;

  beforeEach(function() {
    f = new F();
  });

  it('should push', function() {
    f.eval('[ 1 ] [ 2 ]');
    expect(f.slice(0)).to.eql([ [1],[2] ]);
  });

  it('should handle mssing whitespace', function() {
    expect(f.eval('[1] [2]').slice(0)).to.eql([ [1],[2] ]);
  });

  it('should not eval within quote', function() {
    f.eval('[ 1 ] [ 1 2 + ]');
    expect(f).to.have.length(2);
    expect(f[0]).to.eql([1]);
    expect(f[1].toString()).to.equal('1,2,+');
    expect(f[1][2]).to.be.an('object');
  });

  it('should add', function() {
    expect(f.eval('[1] [2] +').slice(0)).to.eql([ [1,2]  ]);
  });

  it('should multiply', function() {
    expect(new F().eval('[ 1 2 + ] 2 *').slice(0)[0]).to.have.length(6);
  });

  it('should test equality', function() {
    expect(new F().eval('[ 1 2 + ] [ 1 2 ] =').slice(0)).to.eql([false]);
    expect(new F().eval('[ 1 2 + ] [ 1 2 + ] =').slice(0)).to.eql([true]);
  });

  it('should eval lists', function() {
    f.eval('[1 2 +]');
    expect(f).to.have.length(1);
    expect(f[0]).to.have.length(3);
    expect(f.eval('eval').slice(0)).to.eql([3]);
  });

  it('should zip lists', function() {
    f.eval('[ 1 2 + ] [ 4 ]');
    expect(f).to.have.length(2);
    expect(f[0]).to.have.length(3);
    expect(f[1]).to.have.length(1);

    f.eval('*');
    expect(f).to.have.length(1);
    expect(f[0]).to.have.length(6);
    expect(f[0].toString()).to.equal('1,4,2,4,+,4');
  });

  it('should join lists', function() {
    f.eval('[ 1 2 + ] ","');
    expect(f).to.have.length(2);
    expect(f[0]).to.have.length(3);
    expect(f[1]).to.have.length(1);

    f.eval('*');
    expect(f).to.have.length(1);
    expect(f[0]).to.have.length(5);
    expect(f[0].toString()).to.equal('1,2,+');
  });
});

describe('stack', function() {
  var f;

  beforeEach(function() {
    f = new F();
  });

  it('should drop', function() {
    expect(f.eval('1 2 drop 3').slice(0)).to.eql([1,3]);
  });

  it('should swap', function() {
    expect(f.eval('1 2 swap 3').slice(0)).to.eql([2,1,3]);
  });

  it('should dup', function() {
    expect(f.eval('1 2 dup 3').slice(0)).to.eql([1,2,2,3]);
  });

  it('should dup clone', function() {
    f.eval('[ 1 2 3 ] dup')
    expect(f.slice(0)).to.eql([[1,2,3],[1,2,3]]);
    expect(f[0]).to.eql(f[1]);
    expect(f[0]).to.not.equal(f[1]);
  });

  it('should clr', function() {
    expect(f.eval('1 2 clr 3').slice(0)).to.eql([3]);
  });

  it('should sto', function() {
    expect(f.eval('1 2 "x" sto 3 x x').slice(0)).to.eql([1, 3, 2, 2]);
  });

  it('should def', function() {
    expect(f.eval('[ 2 + ] "x" def 3 x x').slice(0)).to.eql([7]);
  });

  it('should slip', function() {
    expect(f.eval('[ 1 2 + ] 4 slip').slice(0)).to.eql([3,4]);
  });

  it('should stack', function() {
    expect(f.eval('1 2 3 stack').slice(0)).to.eql([[1,2,3]]);
  });

  it('should unstack', function() {
    expect(f.eval('[ 1 2 3 ] unstack').slice(0)).to.eql([1,2,3]);
  });

  it('should choose', function() {
    expect(f.eval('true 3 4 choose').slice(0)).to.eql([3]);
    expect(new F().eval('false 3 4 choose').slice(0)).to.eql([4]);
    expect(new F().eval('5 false [ 2 + ] [ 2 * ] branch').slice(0)).to.eql([10]);
    expect(new F().eval('5 true [ 2 + ] [ 2 * ] branch').slice(0)).to.eql([7]);
  });

});
