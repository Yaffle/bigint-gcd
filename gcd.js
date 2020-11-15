
// https://en.wikipedia.org/wiki/Euclidean_algorithm#Method_of_least_absolute_remainders
function numbersGCD(a, b) {
  while (b > 0) {
    const r1 = a % b;
    const r2 = b - r1;
    const r = r1 < r2 ? r1 : r2;
    a = b;
    b = r;
  }
  return a;
}

function EuclidsGCD(a, b) {
  while (b > Number.MAX_SAFE_INTEGER) {
    const r1 = a % b;
    const r2 = b - r1;
    const r = r1 < r2 ? r1 : r2;
    a = b;
    b = r;
  }
  if (b > 0) {
    if (a > Number.MAX_SAFE_INTEGER) {
      const r = a % BigInt(b);
      a = b;
      b = r;
    }
    return BigInt(numbersGCD(Number(a), Number(b)));
  }
  return a;
}

// https://github.com/tc39/ecma262/issues/1729
function bitLength(a) {
  const number = Number(a);
  if (number < 1 / 0) {
    return Math.floor(Math.log2(number)) + 1;
  }
  return a.toString(16).length * 4 + 4;
}

// https://en.wikipedia.org/wiki/Lehmer%27s_GCD_algorithm
// https://www.imsc.res.in/~kapil/crypto/notes/node11.html
// this implementation is good after ~80 bits (?)
function LehmersGCD(a, b) {
  while (b >= Math.sqrt((Number.MAX_SAFE_INTEGER + 1)**3)) {
    console.assert(a >= b);
    const m = BigInt(Math.max(0, bitLength(a) - Math.floor(Math.log2(Number.MAX_SAFE_INTEGER + 1))));
    let x = Number(a >> m);
    let y = Number(b >> m);
    //console.assert(x >= (Number.MAX_SAFE_INTEGER + 1) / 2 && x <= Number.MAX_SAFE_INTEGER);
    //console.assert(y >= 0 && y <= Number.MAX_SAFE_INTEGER);
    let A = 1;
    let B = 0;
    let C = 0;
    let D = 1;
    let w1 = 0;
    let w2 = 0;
    while (y + C !== 0 && y + D !== 0 && (w1 = Math.floor((x + A) / (y + C))) === (w2 = Math.floor((x + B) / (y + D)))) {
      const w = w1;
      [A, B, x, C, D, y] = [C, D, y, A - w * C, B - w * D, x - w * y];
    }
    if (B === 0) {
      console.assert(A === 1 && B === 0 && C === 0 && D === 1);
      const r = a % b;
      a = b;
      b = r;
    } else {
      [a, b] = [BigInt(A) * a + BigInt(B) * b, BigInt(C) * a + BigInt(D) * b];
    }
  }
  return EuclidsGCD(a, b);
}

function abs(a) {
  return a < 0 ? -a : a;
}

function bigIntGCD(a, b) {
  a = abs(a);
  b = abs(b);
  if (a < b) {
    const tmp = a;
    a = b;
    b = tmp;
  }
  return LehmersGCD(a, b);
}

export default bigIntGCD;
