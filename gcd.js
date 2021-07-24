
//TODO: https://en.wikipedia.org/wiki/Euclidean_algorithm#Method_of_least_absolute_remainders
function numbersGCD(a, b) {
  while (b > 0) {
    const q = Math.floor(a / b);
    const r = a - q * b;
    a = b;
    b = r;
  }
  return a;
}

function EuclidsGCD(a, b) {
  while (Number(b) > Number.MAX_SAFE_INTEGER) {
    const r = a % b;
    a = b;
    b = r;
  }
  if (Number(b) > 0) {
    if (Number(a) > Number.MAX_SAFE_INTEGER) {
      const r = a % BigInt(b);
      a = b;
      b = r;
    }
    return BigInt(numbersGCD(Number(a), Number(b)));
  }
  return a;
}

// https://github.com/tc39/proposal-bigint/issues/205
// https://github.com/tc39/ecma262/issues/1729
// floor(log2(a)) + 1 if a > 0
function bitLength(a) {
  const s = a.toString(16);
  const c = s.charCodeAt(0) - '0'.charCodeAt(0);
  if (c <= 0) {
    throw new RangeError();
  }
  return (s.length - 1) * 4 + (32 - Math.clz32(Math.min(c, 8)));
}

// 1 + floor(log2(x))
function log2(x) {
  var e = 0;
  while (x > (1 << 30)) {
    x = Math.floor(x / (1 << 30));
    e += 30;
  }
  e += (32 - Math.clz32(x));
  return e;
}

const LOG2MAX = Math.floor(Math.log2(Number.MAX_SAFE_INTEGER + 1));

var previousValue = -1;
// some terrible optimization as bitLength is slow
function bitLength2(a) {
  if (previousValue === -1) {
    previousValue = bitLength(a)
    return previousValue;
  }
  var n = Number(a >> BigInt(previousValue - LOG2MAX));
  if (n < 1 || n >= (Number.MAX_SAFE_INTEGER + 1)) {
    previousValue = -1;
    return bitLength2(a);
  }
  previousValue = previousValue - LOG2MAX + log2(n);
  return previousValue;
}

const p53 = BigInt(LOG2MAX);
function significand(value, doubleDigit) {
  if (!doubleDigit) {
    return [Number(value), 0];
  }
  var lo = Number(BigInt.asUintN(LOG2MAX, value));
  //var hi = Number(value >> p53);
  // Instead doing something to save one BigInt operation:
  var tmp = Number(value);  
  var hi = Math.floor(tmp / (Number.MAX_SAFE_INTEGER + 1));
  if (Math.floor(tmp - (Number.MAX_SAFE_INTEGER + 1) * hi) === 0) {
    if (lo > (Number.MAX_SAFE_INTEGER + 1) / 2) {
      hi -= 1;
    }
    if (lo === (Number.MAX_SAFE_INTEGER + 1) / 2) {
      hi = Number(value >> p53);
    }
  }
  return [hi, lo]; // 53 bits in hi, 53 bits in lo
}

// 2**n
function exp2(n) {
  var result = 1;
  while (n > 30) {
    n -= 30;
    result *= (1 << 30);
  }
  result *= (1 << n);
  return result;
}

const doubleDigitMethod = true;

function helper(xx, yy) {
  let [x, xlo] = significand(xx, doubleDigitMethod);
  let [y, ylo] = significand(yy, doubleDigitMethod);

  // computes the transformation matrix, which is the product of all {{0, 1}, {1, -q}} matrices,
  // where q is the quotient produced by Euclid's algorithm for any pair of integers (a, b),
  // where a within [xx; xx + 1) and b within [yy; yy + 1)
  let A = 1, B = 0, C = 0, D = 1; // 2x2-matrix transformation matrix of (x_initial, y_initial) into (x, y)

  let lobits = LOG2MAX;
  for (let i = doubleDigitMethod ? 0 : 3; i < 4; i++) {

    let sameQuotient = y !== 0;
    while (sameQuotient) {
      //console.assert(y >= 0);
      const q = Math.floor(x / y);
      const C1 = A - q * C, D1 = B - q * D, y1 = x - q * y;
      sameQuotient = y1 + C1 >= 0 && y1 + C1 < y + C &&
                     y1 + D1 >= 0 && y1 + D1 < y + D;
      if (sameQuotient) { // Quotient(T.transformPoint(x_initial + 1, y_initial)) === Quotient(T.transformPoint(x_initial, y_initial + 1))
        // Multiply matrix agumented by column (x, y) by {{0, 1}, {1, -q}} from the right:
        A = C; B = D; x = y;
        C = C1; D = D1; y = y1;
        //gcd.debug(q);
      }
    }

    if (i < 3) {
      const bits = Math.min(LOG2MAX - 1 - log2(Math.max(x, y)), lobits); // assuming that max(x, y) > max(abs(A), abs(B), abs(C), abs(D))
      const d = exp2(lobits - bits);
      const xlo1 = Math.floor(xlo / d);
      const ylo1 = Math.floor(ylo / d);
      xlo -= xlo1 * d;
      ylo -= ylo1 * d;
      lobits -= bits;
      const p = exp2(bits);
      x = A * xlo1 + B * ylo1 + x * p;
      y = C * xlo1 + D * ylo1 + y * p;
    }

  }
  return [A, B, C, D];
}

function halfgcd(a, b, useSubquadraticMethod) {
  //console.assert(a >= b && b >= 0n);

  // the function calculates the transformation matrix for numbers (x, y), where a <= x < a + 1 and b <= y < b + 1
  // seems, this definition is not the same as in https://mathworld.wolfram.com/Half-GCD.html

  // floor((a + 1) / b) < q = floor(a / b) < floor(a / (b + 1))
  // ([A, B], [C, D]) * (a + x, b + y) = (A*(a+x)+B*(b+y), C*(a+x)+D*(b+y)) = (A*a+B*b, C*a+D*b) + (A*x+B*y, C*x+D*y)
  //Note: for debugging it is useful to compare quotients in simple Euclidean algorithms vs quotients here

  if (!useSubquadraticMethod || Number(a) < Math.pow(Number.MAX_SAFE_INTEGER + 1, 2)) {
    const [A, B, C, D] = helper(a, b);
    return [BigInt(A), BigInt(B), BigInt(C), BigInt(D), 0n, 0n];
  }
  const size = bitLength(a);
  let [A, B, C, D] = [1n, 0n, 0n, 1n]; // 2x2 matrix
  let step = 0;
  while (true) { // Q(T, a + 1n, b) === Q(T, a, b + 1n)
    step += 1;

    //console.assert(A * D >= 0 && B * C >= 0 && A * B <= 0 && D * C <= 0);//TODO: why - ?

    // A*(X+Y) = A*X+A*Y
    //const [a1, b1] = [a + A, b + C]; // T * (a_initial + 1n, b_initial);
    //const [a2, b2] = [a + B, b + D]; // T * (a_initial, b_initial + 1n);
    const n = step === 1 ? size : bitLength(a);
    if (n <= size * (2 / 3)) { // TODO: ?, the constant is based on some testing with some example
      return [A, B, C, D, a, b];
    }
    const m1 = n < 1024 ? Math.max(n - LOG2MAX * 2, 0) : Math.floor(n / 2); // 512 is a good choise, seems
    const m = BigInt(m1);
    if (step !== 1/* && m1 < size / 2*/) {//?
      if (((a + A) >> m) !== ((a + B) >> m) ||
          ((b + C) >> m) !== ((b + D) >> m)) {
        return [A, B, C, D, a, b];
      }
    }
    const [A1, B1, C1, D1, transformedAhi, transformedBhi] = halfgcd(a >> m, b >> m, n >= 1024);
    if (step === 1) {
      [A, B, C, D] = [A1, B1, C1, D1];
    } else {
      // T = T1 * T:
      [A, B, C, D] = [A1 * A + B1 * C, A1 * B + B1 * D,
                      C1 * A + D1 * C, C1 * B + D1 * D];
    }
    if (n - m1 <= LOG2MAX * 2) {
      [a, b] = [A1 * a + B1 * b, C1 * a + D1 * b]; // T1 * (a, b)
    } else {
      const alo = BigInt.asUintN(m1, a);
      const blo = BigInt.asUintN(m1, b);
      [a, b] = [(A1 * alo + B1 * blo) + (transformedAhi << m), (C1 * alo + D1 * blo) + (transformedBhi << m)]; // T * (alo, blo) + T * (ahi, bhi) * 2**m
    }
    console.assert(a > 0n && b >= 0n);
    if (B1 === 0n) {
      console.assert(A1 === 1n && B1 === 0n && C1 === 0n && D1 === 1n);
      if (b !== 0n) {//TODO: ?
        const q = a / b;
        const C2 = A - q * C, D2 = B - q * D, b1 = a - q * b;
        const sameQuotient = b1 + C2 >= 0 && b1 + C2 < b + C &&
                             b1 + D2 >= 0 && b1 + D2 < b + D;
        if (!sameQuotient) {
          return [A, B, C, D, a, b];
        }
        [A, B, C, D] = [C, D, C2, D2]; // {{0, 1}, {1, -q}} * T
        [a, b] = [b, b1]; // {{0, 1}, {1, -q}} * (a, b)
        //gcd.debug(q);
      } else {
        return [A, B, C, D, a, b];
      }
    }
  }
  // see "2. General structure of subquadratic gcd algorithms" in “On Schönhage’s algorithm and subquadratic integer GCD computation” by Möller
  return [A, B, C, D, a, b]; // for performance transformedA and transformedB are returned
}

const SUBQUADRATIC_GCD_THRESHOLD = (32 * 1024);

let lastMaxSize = -1;

// https://en.wikipedia.org/wiki/Lehmer%27s_GCD_algorithm
// https://www.imsc.res.in/~kapil/crypto/notes/node11.html
// this implementation is good after ~80 bits (?)
function LehmersGCD(a, b) {
  if (a < b) {
    const tmp = a;
    a = b;
    b = tmp;
  }
  let useSubquadraticMethod = true;
  while (Number(b) >= Math.sqrt(Math.pow(Number.MAX_SAFE_INTEGER + 1, 3))) {
    //console.assert(a >= b);
    const n = bitLength2(a);
    if (useSubquadraticMethod) {
      useSubquadraticMethod = BigInt.asUintN(SUBQUADRATIC_GCD_THRESHOLD, b) < b;
    }
    const m1 = !useSubquadraticMethod ? Math.max(0, n - LOG2MAX * (doubleDigitMethod ? 2 : 1)) : Math.floor(n / 2);
    const m = BigInt(m1);
    const ahi = a >> m;
    const bhi = b >> m;
    const [A, B, C, D, transformedAhi, transformedBhi] = halfgcd(ahi, bhi, useSubquadraticMethod);
    if (B === 0n) {
      //console.assert(A === 1n && B === 0n && C === 0n && D === 1n);
      //gcd.debug(a / b);
      const r = a % b;
      a = b;
      b = r;
    } else {
      if (!useSubquadraticMethod) {
        [a, b] = [A * a + B * b, C * a + D * b]; // T * (a, b)
      } else {
        const alo = BigInt.asUintN(m1, a);
        const blo = BigInt.asUintN(m1, b);
        [a, b] = [(A * alo + B * blo) + (transformedAhi << m), (C * alo + D * blo) + (transformedBhi << m)]; // T * (alo, blo) + T * (ahi, bhi) * 2**m
      }
      //console.assert(a >= b && b > 0n);
    }
  }
  return EuclidsGCD(a, b);
}

function abs(a) {
  return a < 0n ? -a : a;
}

function ctz(a) {
  // https://en.wikipedia.org/wiki/Find_first_set#Properties_and_relations
  //return bitLength(a & (-a)) - 1;
  const s = a.toString(16);
  let n = s.length - 1;
  while (s.charCodeAt(n) === '0'.charCodeAt(0)) {
    n -= 1;
  }
  let x = s.charCodeAt(n);
  if (x < 'a'.charCodeAt(0)) {
    x -= '0'.charCodeAt(0);
  } else {
    x -= 'a'.charCodeAt(0);
    x += 10;
  }
  //var e = (31 - Math.clz32(x & -x));
  var e = 0;
  while (x % 2 === 0) {
    x /= 2;
    e += 1;
  }
  return (s.length - 1 - n) * 4 + e;
}

function bigIntGCD(a, b) {
  if (typeof a === "number" && typeof b === "number") {
    return numbersGCD(Math.abs(a), Math.abs(b));
  }
  var na = Math.abs(Number(a));
  var nb = Math.abs(Number(b));
  if (na < nb) {
    var tmp = a;
    a = b;
    b = tmp;
    var tmp1 = na;
    na = nb;
    nb = tmp1;
  }
  if (na <= Number.MAX_SAFE_INTEGER) {
    return numbersGCD(na, nb);
  }
  if (nb <= Number.MAX_SAFE_INTEGER) {
    if (nb === 0) {
      return a;
    }
    if (nb === 1) {
      return 0;
    }
    return numbersGCD(nb, Number(a % BigInt(b)));
  }
  a = abs(BigInt(a));
  b = abs(BigInt(b));
  if (nb >= 1/0) {
    var size = Math.min(bitLength(a), bitLength(b));
    size = Math.pow(2, bitLength(size));
    if (size >= 64 * 1024) {
      if (size > lastMaxSize) {
        lastMaxSize = size;
        var error = new TypeError("big size of " + "gcd" + " " + size);
        if (globalThis.onerror != null) {
          globalThis.onerror(error.message, "", 0, 0, error);
        }
      }
    }
  }
  if (nb > (Number.MAX_SAFE_INTEGER + 1) * (1 << 11)) {
    const c1 = ctz(a);
    const c2 = ctz(b);
    if (c1 > 4 || c2 > 4) {
      const g = LehmersGCD(c1 === 0 ? a : a >> BigInt(c1), c2 === 0 ? b : b >> BigInt(c2));
      const c = Math.min(c1, c2);
      return c === 0 ? g : (g << BigInt(c));
    }
  }
  return LehmersGCD(a, b);
}

export default bigIntGCD;
