/*jshint esversion:11*/

const MAX_SAFE_INTEGER = BigInt(Number.MAX_SAFE_INTEGER);
const U64_MAX = BigInt.asUintN(64, -1n);

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

/*

export function gcd(a:u64, b:u64):u64 {
  if (b !== 0) {
    do {
      const r = a % b;
      a = b;
      b = r;
    } while (b !== 0);
  }
  return a;
}

*/

const i64gcdCode = new Uint8Array([0,97,115,109,1,0,0,0,1,7,1,96,2,126,126,1,126,3,2,1,0,7,7,1,3,103,99,100,0,0,10,39,1,37,1,1,126,32,1,66,0,82,4,64,3,64,32,0,32,1,130,33,2,32,1,33,0,32,2,34,1,66,0,82,13,0,11,11,32,0,11]);

let i64gcd = null;
if (globalThis.WebAssembly != null) {
  try {
    const f = new WebAssembly.Instance(new WebAssembly.Module(i64gcdCode)).exports.gcd;
    if (f(BigInt(0), BigInt(0)) === BigInt(0)) {
      i64gcd = f;
    }
  } catch (error) {
    console.log(error);
  }
}

function EuclidsGCD(a, b) {
  const M = i64gcd != null ? U64_MAX : MAX_SAFE_INTEGER;
  while (b > M) {
    const r = a % b;
    a = b;
    b = r;
  }
  if (b > 0n) {
    if (a > M) {
      const r = a % b;
      a = b;
      b = r;
    }
    if (i64gcd != null) {
      return BigInt.asUintN(64, i64gcd(a, b));
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
  const c = s.charCodeAt(0) - 0 - '0'.charCodeAt(0);
  if (c <= 0) {
    throw new RangeError();
  }
  return (s.length - 1) * 4 + (32 - Math.clz32(Math.min(c, 8)));
}

// 1 + floor(log2(x))
function log2(x) {
  let e = 0;
  while (x > (1 << 30)) {
    x = Math.floor(x / (1 << 30));
    e += 30;
  }
  e += (32 - Math.clz32(x));
  return e;
}

let DIGITSIZE = 53;
const doubleDigitMethod = true;

const wasmCode2 = new Uint8Array([0,97,115,109,1,0,0,0,1,14,2,96,0,1,126,96,5,126,126,126,126,127,1,127,3,6,5,1,0,0,0,0,5,3,1,0,0,6,21,4,126,1,66,0,11,126,1,66,0,11,126,1,66,0,11,126,1,66,0,11,7,35,6,6,104,101,108,112,101,114,0,0,1,65,0,1,1,66,0,2,1,67,0,3,1,68,0,4,6,109,101,109,111,114,121,2,0,10,142,3,5,247,2,2,8,126,2,127,66,1,33,6,66,1,33,9,32,0,66,127,82,32,2,66,0,82,113,4,64,3,64,32,0,32,7,124,33,7,32,0,32,6,124,33,6,32,2,32,5,124,33,5,32,2,32,9,124,33,9,32,14,65,1,113,4,126,32,7,33,8,32,6,33,7,32,8,33,6,32,5,33,8,32,9,33,5,32,8,5,32,9,11,33,8,3,64,32,6,32,7,32,8,128,34,12,32,5,126,34,9,125,32,5,84,32,6,32,9,90,113,4,64,32,14,65,1,106,33,14,32,7,32,8,32,12,126,125,33,11,32,6,32,9,125,33,10,32,0,32,2,32,12,126,125,33,9,32,5,33,7,32,8,33,6,32,2,33,0,32,11,33,5,32,10,33,8,32,9,33,2,12,1,11,11,32,6,32,0,125,33,6,32,7,32,0,125,33,7,32,5,32,2,125,33,5,32,8,32,2,125,33,9,32,14,65,1,113,4,64,32,6,33,8,32,7,33,6,32,8,33,7,32,5,33,8,32,9,33,5,32,8,33,9,11,32,4,32,0,32,6,32,7,32,6,32,7,85,27,124,121,167,34,13,32,4,32,13,72,27,34,13,4,64,32,1,32,1,32,4,32,13,107,34,4,172,34,8,136,34,11,32,8,134,125,33,1,32,3,32,3,32,8,136,34,10,32,8,134,125,33,3,32,6,32,11,126,32,7,32,10,126,124,32,0,32,13,172,34,8,134,124,33,0,32,5,32,11,126,32,9,32,10,126,124,32,2,32,8,134,124,33,2,11,32,13,13,0,11,11,32,6,36,0,32,7,36,1,32,5,36,2,32,9,36,3,65,0,11,4,0,35,0,11,4,0,35,1,11,4,0,35,2,11,4,0,35,3,11]);

let wasmHelper = null;
if (true && globalThis.WebAssembly != null) {
  try {
    const exports = new WebAssembly.Instance(new WebAssembly.Module(wasmCode2)).exports;
    if (exports.helper(BigInt(1), BigInt(0), BigInt(1), BigInt(0)) != null) {
      wasmHelper = function (x, xlo, y, ylo, lobits) {
        exports.helper(x, xlo, y, ylo, lobits);
        return [exports.A(), exports.B(), exports.C(), exports.D()];
      };
      DIGITSIZE = 64;
    }
  } catch (error) {
    console.log(error);
  }
}


const frexpf64 = typeof Float64Array !== 'undefined' ? new Float64Array(1) : null;
const frexpi32 = typeof Float64Array !== 'undefined' ? new Int32Array(frexpf64.buffer) : null;

let previousValue = 0;
// some terrible optimization as bitLength is slow
function bitLength2(a) {
  if (previousValue <= 1024) {
    const n = Number(BigInt(a));
    if (frexpf64 != null) {
      frexpf64[0] = n;
      const e = (frexpi32[1] >> 20) - 1023;
      if (e < 1024 && frexpi32[0] !== 0 || (frexpi32[1] & 0xFFFFF) !== 0) {
        previousValue = e + 1;
        return previousValue;
      }
    }
    const x = Math.log2(n) + 1024 * 4 - 1024 * 4;
    const y = Math.ceil(x);
    if (x !== y) {
      previousValue = y;
      return previousValue;
    }
  }
  if (previousValue < DIGITSIZE) {
    previousValue = DIGITSIZE;
  }
  const n = Number(a >> BigInt(previousValue - DIGITSIZE));
  if (n >= 1 && n <= Number.MAX_SAFE_INTEGER) {
    previousValue = previousValue - DIGITSIZE + log2(n);
    return previousValue;
  }
  previousValue = bitLength(a);
  return previousValue;
}


function helper(X, Y) {
  if (typeof X !== 'bigint' || typeof Y !== 'bigint') {
    throw new TypeError();
  }
  if (!doubleDigitMethod) {
    if (wasmHelper != null) {
      return wasmHelper(X, 0n, Y, 0n, 0);
    }
    return jsHelper(X, 0n, Y, 0n, 0);
  }
  if (wasmHelper != null) {
    if (DIGITSIZE !== 64) {
      throw new RangeError();
    }
    const x = BigInt.asUintN(64, X >> 64n);
    const xlo = BigInt.asUintN(64, X);
    const y = BigInt.asUintN(64, Y >> 64n);
    const ylo = BigInt.asUintN(64, Y);
    return wasmHelper(x, xlo, y, ylo, 64);
  }
  if (DIGITSIZE !== 53) {
    throw new RangeError();
  }
  const x = X >> 53n;
  const xlo = BigInt.asUintN(53, X);
  const y = Y >> 53n;
  const ylo = BigInt.asUintN(53, Y);
  return jsHelper(x, xlo, y, ylo, 53);
}



function AsmModule(stdlib) {
  "use asm";
  
  var floor = stdlib.Math.floor;
  var max = stdlib.Math.max;
  var clz32 = stdlib.Math.clz32;
  
  var gA = 0.0;
  var gB = 0.0;
  var gC = 0.0;
  var gD = 0.0;


// 1 + floor(log2(x))
function log2(x) {
  x = +x;
  var e = 0;
  while (x >= 4294967296.0) {
    x = x * 2.3283064365386963e-10;
    e = (e + 32) | 0;
  }
  e = (e + (32 - (clz32(~~x) | 0))) | 0;
  return e | 0;
}

// 2**n
function exp2(n) {
  n = n | 0;
  var result = 1.0;
  while ((n | 0) < 0) {
    n = (n + 32) | 0;
    result = result * 2.3283064365386963e-10; // * 2**-32
  }
  while ((n | 0) >= 32) {
    n = (n - 32) | 0;
    result = result * 4294967296.0; // * 2**32
  }
  result = result * +((1 << n) >>> 0);
  return +result;
}


// @Deprecated, see helper64.js
function jsHelper(x, xlo, y, ylo, lobits) {
  x = +x;
  xlo = +xlo;
  y = +y;
  ylo = +ylo;
  lobits = lobits | 0;

  // computes the transformation matrix, which is the product of all {{0, 1}, {1, -q_i}} matrices,
  // where q_i are the quotients produced by Euclidean algorithm for any pair of integers (a, b),
  // where a within [x, x + 1] and b within [y, y + 1]

  // 2x2-matrix transformation matrix of (x_initial, y_initial) into (x, y):
  var A = 1.0;
  var B = 0.0;
  var C = 0.0;
  var D = 1.0;

  var bits = 0;
  var sameQuotient = 0;
  var q = 0.0;
  var y1 = 0.0;
  var A1 = 0.0;
  var B1 = 0.0;
  var C1 = 0.0;
  var D1 = 0.0;
  var b = 0;
  var d = 0.0;
  var dInv = 0.0;
  var xlo1 = 0.0;
  var ylo1 = 0.0;
  var p = 0.0;
  if (y != 0.0) {
    do {
      do {
        //console.assert(y > 0);
        q = floor(x / y);
        y1 = x - q * y;
        // Multiply matrix augmented by column (x, y) by {{0, 1}, {1, -q}} from the right:
        A1 = C;
        B1 = D;
        C1 = A - q * C;
        D1 = B - q * D;
        // The quotient for a point (x_initial + alpha, y_initial + beta), where 0 <= alpha < 1 and 0 <= beta < 1:
        // floor((x + A * alpha + B * beta) / (y + C * alpha + D * beta))
        // As the sign(A) === -sign(B) === -sign(C) === sign(D) (ignoring zero entries) the maximum and minimum values are floor((x + A) / (y + C)) and floor((x + B) / (y + D))

        // floor((x + A) / (y + C)) === q  <=>  0 <= (x + A) - q * (y + C) < (y + C)  <=>  0 <= y1 + C1 < y + C
        // floor((x + B) / (y + D)) === q  <=>  0 <= (x + B) - q * (y + D) < (y + D)  <=>  0 <= y1 + D1 < y + D
        sameQuotient = (0.0 <= y1 + C1) & (y1 + C1 < y + C) &
                       (0.0 <= y1 + D1) & (y1 + D1 < y + D);
        //sameQuotient = C1 < 0 && -C1 <= y1 && D1 - D < y - y1 ||
        //               D1 < 0 && -D1 <= y1 && C1 - C < y - y1;
        if (sameQuotient) {
          x = y;
          y = y1;
          A = A1;
          B = B1;
          C = C1;
          D = D1;
          //gcd.debug(q);
        }
      } while (sameQuotient);

      b = (53 - (log2(x + max(A, B)) | 0)) | 0;
      bits = (b | 0) < 0 ? b : ((b | 0) > (lobits | 0) ? lobits : b);
      if ((b | 0) != 0) {
        d = +exp2((lobits - bits) | 0);
        dInv = +exp2((bits - lobits) | 0);
        xlo1 = +floor(xlo * dInv);
        ylo1 = +floor(ylo * dInv);
        xlo = xlo - xlo1 * d;
        ylo = ylo - ylo1 * d;
        lobits = (lobits - bits) | 0;
        p = +exp2(bits);
        x = A * xlo1 + B * ylo1 + x * p;
        y = C * xlo1 + D * ylo1 + y * p;
      }

    } while ((bits | 0) != 0);
  }
  gA = A;
  gB = B;
  gC = C;
  gD = D;
  return 0;
}

  function A() {
    return gA;
  }
  function B() {
    return gB;
  }
  function C() {
    return gC;
  }
  function D() {
    return gD;
  }

  return {helper: jsHelper, A: A, B: B, C: C, D: D};
}

const asmExports = AsmModule(globalThis);
const jsHelper = function (x, xlo, y, ylo, lobits) {
  asmExports.helper(Number(x), Number(xlo), Number(y), Number(ylo), lobits);
  return [BigInt(asmExports.A()), BigInt(asmExports.B()), BigInt(asmExports.C()), BigInt(asmExports.D())];
};



const SUBQUADRATIC_HALFGCD_THRESHOLD = 4096;

function matrixMultiply(A1, B1, C1, D1, A, B, C, D) {
  return [A1 * A + B1 * C, A1 * B + B1 * D,
          C1 * A + D1 * C, C1 * B + D1 * D];
}

function halfgcd(a, b, small) {
  //console.assert(a >= b && b >= 0n);

  // the function calculates the transformation matrix for numbers (x, y), where a <= x < a + 1 and b <= y < b + 1
  // seems, this definition is not the same as in https://mathworld.wolfram.com/Half-GCD.html

  // floor((a + 1) / b) < q = floor(a / b) < floor(a / (b + 1))
  // ([A, B], [C, D]) * (a + x, b + y) = (A*(a+x)+B*(b+y), C*(a+x)+D*(b+y)) = (A*a+B*b, C*a+D*b) + (A*x+B*y, C*x+D*y)
  //Note: for debugging it is useful to compare quotients in simple Euclidean algorithms vs quotients here

  if (small) {
    const [A, B, C, D] = helper(a, b);
    return [A, B, C, D, 0n, 0n];
  }
  const size = bitLength(a);
  const isSmall = size <= SUBQUADRATIC_HALFGCD_THRESHOLD;
  let [A, B, C, D] = [1n, 0n, 0n, 1n]; // 2x2 matrix
  let step = 0;
  while (true) { // Q(T, a + 1n, b) === Q(T, a, b + 1n)
    step += 1;

    //console.assert(A * D >= 0 && B * C >= 0 && A * B <= 0 && D * C <= 0);//TODO: why - ?

    // A*(X+Y) = A*X+A*Y
    //const [a1, b1] = [a + A, b + C]; // T * (a_initial + 1n, b_initial);
    //const [a2, b2] = [a + B, b + D]; // T * (a_initial, b_initial + 1n);
    //if (!isSmall && n <= size * (2 / 3)) { // TODO: ?, the constant is based on some testing with some example
    //  return [A, B, C, D, a, b];
    //}
    const m = BigInt(isSmall ? Math.max(0, bitLength2(a) - DIGITSIZE * (doubleDigitMethod ? 2 : 1)) : Math.floor(size / 2**step));
    if (step !== 1/* && m1 < size / 2*/) {//?
      if (((a + A) >> m) !== ((a + B) >> m) ||
          ((b + C) >> m) !== ((b + D) >> m)) {
        return [A, B, C, D, a, b];
      }
    }
    const [M0, M1, M2, M3, transformedAhi, transformedBhi] = halfgcd(a >> m, b >> m, isSmall);
    const A1 = BigInt(M0);
    const B1 = BigInt(M1);
    const C1 = BigInt(M2);
    const D1 = BigInt(M3);
    if (step === 1) {
      [A, B, C, D] = [A1, B1, C1, D1];
    } else {
      // T = T1 * T:
      const [M4, M5, M6, M7] = matrixMultiply(A1, B1, C1, D1, A, B, C, D);
      A = BigInt(M4);
      B = BigInt(M5);
      C = BigInt(M6);
      D = BigInt(M7);
    }
    if (isSmall) {
      [a, b] = [A1 * a + B1 * b, C1 * a + D1 * b]; // T1 * (a, b)
    } else {
      const alo = BigInt.asUintN(Number(m), a);
      const blo = BigInt.asUintN(Number(m), b);
      [a, b] = [(A1 * alo + B1 * blo) + (transformedAhi << m), (C1 * alo + D1 * blo) + (transformedBhi << m)]; // T * (alo, blo) + T * (ahi, bhi) * 2**m
    }
    console.assert(a > 0n && b >= 0n);
    if (B1 === 0n) {
      console.assert(A1 === 1n && B1 === 0n && C1 === 0n && D1 === 1n);
      if (b !== 0n) {//TODO: ?
        const q = BigInt(a) / b;
        const C2 = A - q * C, D2 = B - q * D, b1 = a - q * b;
        const sameQuotient = b1 + C2 >= 0n && b1 + C2 < b + C &&
                             b1 + D2 >= 0n && b1 + D2 < b + D;
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
const LEHMERS_ALGORITHM_THRESHOLD = BigInt(2**68);

const toBigIntu64 = typeof BigUint64Array !== 'undefined' ? new BigUint64Array(1) : null;
const toBigInti32 = typeof BigUint64Array !== 'undefined' ? new Int32Array(toBigIntu64.buffer) : null;
const toBigInt = function (i) {
  if (toBigIntu64 != null) {
    toBigInti32[0] = i;
    return toBigIntu64[0];
  }
  return BigInt(i);
};

// https://en.wikipedia.org/wiki/Lehmer%27s_GCD_algorithm
// https://www.imsc.res.in/~kapil/crypto/notes/node11.html
// this implementation is good after ~80 bits (?)
function LehmersGCD(a, b) {
  if (a < b) {
    const tmp = a;
    a = b;
    b = tmp;
  }

  // Subquadratic Lehmer's algorithm:
  while (BigInt.asUintN(SUBQUADRATIC_GCD_THRESHOLD, b) < b) {
    //console.assert(a >= b);
    const n = bitLength(a);
    const m = BigInt(Math.floor(n * 2 / 3)); // 2/3 is somehow faster
    const [A1, B1, C1, D1, transformedAhi, transformedBhi] = halfgcd(a >> m, b >> m, false);
    if (B1 === 0n) {
      //console.assert(A1 === 1n && B1 === 0n && C1 === 0n && D1 === 1n);
      //gcd.debug(a / b);
      [a, b] = [b, a % b];
    } else {
      const alo = BigInt.asUintN(Number(m), a);
      const blo = BigInt.asUintN(Number(m), b);
      [a, b] = [(A1 * alo + B1 * blo) + (transformedAhi << m), (C1 * alo + D1 * blo) + (transformedBhi << m)]; // T * (alo, blo) + T * (ahi, bhi) * 2**m
      if (a < 0n || b < 0n) {
        throw new TypeError("assertion");
      }
    }
  }

  // Lehmer's algorithm:
  while (b >= LEHMERS_ALGORITHM_THRESHOLD) {
    //console.assert(a >= b);
    const n = bitLength2(a);
    const m = Math.max(0, n - DIGITSIZE * (doubleDigitMethod ? 2 : 1));
    const [A1, B1, C1, D1] = helper((m === 0 ? a : a >> toBigInt(m)), (m === 0 ? b : b >> toBigInt(m)));
    if (B1 === 0n) {
      //console.assert(A1 === 1n && B1 === 0n && C1 === 0n && D1 === 1n);
      //gcd.debug(a / b);
      [a, b] = [b, a % b];
      console.debug('%');
    } else {
      if (LehmersGCD.progress != null) {
        LehmersGCD.progress.push(bitLength(b));
      }
      [a, b] = [A1 * a + B1 * b, C1 * a + D1 * b]; // T * (a, b)
      if (LehmersGCD.progress != null) {
        LehmersGCD.progress.push(bitLength(b));
      }
      if (a < 0n || b < 0n) {
        throw new TypeError("assertion");
      }
    }
  }

  return EuclidsGCD(a, b);
}


function abs(a) {
  return a < 0n ? -a : a;
}

function numberCTZ(a) {
  return 32 - (Math.clz32(a & -a) + 1);
}
function ctz(a) {
  const test = BigInt.asUintN(32, a);
  if (test !== 0n) {
    return numberCTZ(Number(test));
  }
  let k = 32;
  while (BigInt.asUintN(k, a) === 0n) {
    k *= 2;
  }
  let n = 0;
  for (let i = Math.floor(k / 2); i >= 32; i = Math.floor(i / 2)) {
    if (BigInt.asUintN(i, a) === 0n) {
      n += i;
      a >>= BigInt(i);
    } else {
      a = BigInt.asUintN(i, a);
    }
  }
  n += numberCTZ(Number(BigInt(BigInt.asUintN(32, a))));
  return n;
}

function bigIntGCD(a, b) {
  const A = abs(BigInt(a));
  const B = abs(BigInt(b));

  if (i64gcd == null) {
    const na = Number(A);
    const nb = Number(B);
    if (Math.max(na, nb) <= Number.MAX_SAFE_INTEGER) {
      return BigInt(numbersGCD(na, nb));
    }
    const abmin = Math.min(na, nb);
    if (abmin <= Number.MAX_SAFE_INTEGER) {
      if (abmin === 0) {
        return A + B;
      }
      if (abmin === 1) {
        return 1n;
      }
      return BigInt(numbersGCD(abmin, Math.abs(Number(na < nb ? B % A : A % B))));
    }
  }
  if (i64gcd != null) {
    const isASmall = BigInt.asUintN(64, A) === A;
    const isBSmall = BigInt.asUintN(64, B) === B;
    if (isASmall && isBSmall) {
      return BigInt.asUintN(64, i64gcd(A, B));
    } else if (isASmall || isBSmall) {
      if (a === 0n) {
        return b;
      }
      if (b === 0n) {
        return a;
      }
      if (a === 1n) {
        return 1n;
      }
      if (b === 1n) {
        return 1n;
      }
      return BigInt.asUintN(64, i64gcd(isASmall ? A : A % B, isBSmall ? B : B % A));
    }
  }
  if (true) {
    const c1 = ctz(A);
    const c2 = ctz(B);
    if (c1 + c2 >= 4) {
      const g = LehmersGCD(c1 === 0 ? A : A >> BigInt(c1), c2 === 0 ? B : B >> BigInt(c2));
      const c = Math.min(c1, c2);
      return c === 0 ? g : (BigInt(g) << BigInt(c));
    }
  }
  return LehmersGCD(A, B);
}

export default bigIntGCD;
//globalThis.bigIntGCD = bigIntGCD;
