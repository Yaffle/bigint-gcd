/*jshint esversion:11*/

import wast2wasm from './wast2wasm.js';

const MAX_SAFE_INTEGER = BigInt(Number.MAX_SAFE_INTEGER);

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

const wast = (strings) => String.raw({ raw: strings });

let wastCode1 = wast`
(module
  (type $type1 (func (param i64 i64) (result i64)))
  (export "gcd" (func $gcd))
  (func $gcd (param $a i64) (param $b i64) (result i64)
   (local $r i64)
   (loop $loop1
    (if (i64.ne (local.get $b) (i64.const 0))
     (block
      (local.set $r (i64.rem_u (local.get $a) (local.get $b)))
      (local.set $a (local.get $b))
      (local.set $b (local.get $r))
      (br $loop1)
     )
    )
   )
   (local.get $a)
  )
)`;

let i64gcd = null;
if (globalThis.WebAssembly != null) {
  try {
    const f = new WebAssembly.Instance(new WebAssembly.Module(wast2wasm(wastCode1))).exports.gcd;
    if (f(BigInt(0), BigInt(0)) === BigInt(0)) {
      i64gcd = f;
    }
  } catch (error) {
    console.log(error);
  }
}

function EuclidsGCD(a, b) {
  while (b > MAX_SAFE_INTEGER) {
    const r = a % b;
    a = b;
    b = r;
  }
  if (b > 0n) {
    if (a > MAX_SAFE_INTEGER) {
      const r = a % b;
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

const LOG2MAX = Math.floor(Math.log2(Number.MAX_SAFE_INTEGER + 1));
let DIGITSIZE = LOG2MAX;
const doubleDigitMethod = true;

let wastCode2 = wast`
(module
  (type $type1 (func (param i64 i64 i64 i64) (result i64 i64 i64 i64)))
  (export "helper" (func $helper))
  (func $helper (param $x i64) (param $xlo i64) (param $y i64) (param $ylo i64) (result i64 i64 i64 i64)
    (local $A i64)
    (local $B i64)
    (local $C i64)
    (local $D i64)
    (local $i i32)
    (local $q i64)
    (local $y1 i64)
    (local $A1 i64)
    (local $B1 i64)
    (local $C1 i64)
    (local $D1 i64)
    (local $sameQuotient i32)
    (local $bits i64)
    (local $xlo1 i64)
    (local $ylo1 i64)
    (local $lobits i64)
    (local.set $A (i64.const 1))
    (local.set $B (i64.const 0))
    (local.set $C (i64.const 0))
    (local.set $D (i64.const 1))
    (local.set $i (i32.const 7))
    (local.set $lobits (i64.add (i64.const 63) (i64.const 1)))
    (loop $loop1
      (local.set $A1 (local.get $A))
      (local.set $B1 (local.get $B))
      (local.set $C1 (local.get $C))
      (local.set $D1 (local.get $D))
      (local.set $y1 (local.get $y))
      (local.set $y (local.get $x))
      (loop $loop2
        (local.set $x (local.get $y))
        (local.set $y (local.get $y1))
        (local.set $A (local.get $A1))
        (local.set $B (local.get $B1))
        (local.set $C (local.get $C1))
        (local.set $D (local.get $D1))
        (local.set $q (i64.div_u (local.get $x) (local.get $y)))
        (local.set $y1 (i64.sub (local.get $x) (i64.mul (local.get $y) (local.get $q))))
        (local.set $A1 (local.get $C))
        (local.set $B1 (local.get $D))
        (local.set $C1 (i64.sub (local.get $A) (i64.mul (local.get $q) (local.get $C))))
        (local.set $D1 (i64.sub (local.get $B) (i64.mul (local.get $q) (local.get $D))))
        (local.set $sameQuotient
          (i32.and
            (i64.gt_u (i64.add (i64.add (i64.clz (i64.sub (i64.const 0) (local.get $D))) (i64.clz (local.get $D))) (i64.clz (local.get $q))) (i64.add (i64.const 63) (i64.const 1)))
            (i32.or
              (i32.and (i64.lt_s (local.get $C1) (i64.const 0)) (i32.and (i64.le_u (i64.sub (i64.const 0) (local.get $C1)) (local.get $y1)) (i64.lt_u (i64.sub (local.get $D1) (local.get $D)) (i64.sub (local.get $y) (local.get $y1)))))
              (i32.and (i64.lt_s (local.get $D1) (i64.const 0)) (i32.and (i64.le_u (i64.sub (i64.const 0) (local.get $D1)) (local.get $y1)) (i64.lt_u (i64.sub (local.get $C1) (local.get $C)) (i64.sub (local.get $y) (local.get $y1)))))
            )
          )
        )
        (br_if $loop2 (i32.ne (local.get $sameQuotient) (i32.const 0)))
      )
      (local.set $bits
        (select
         (i64.const 0)
         (i64.clz (i64.add (local.get $x) (select (local.get $A) (local.get $B) (i64.gt_s (local.get $A) (local.get $B)))))
         (i64.lt_s (local.get $x) (i64.const 0))
        )
      )
    (if (i64.ne (local.get $bits) (i64.const 0))
     (block
      (local.set $bits (select (local.get $lobits) (local.get $bits) (i64.gt_s (local.get $bits) (local.get $lobits))))
      (local.set $lobits (i64.sub (local.get $lobits) (local.get $bits)))
      (local.set $xlo1 (i64.shr_u (local.get $xlo) (local.get $lobits)))
      (local.set $ylo1 (i64.shr_u (local.get $ylo) (local.get $lobits)))
      (local.set $xlo (i64.sub (local.get $xlo) (i64.shl (local.get $xlo1) (local.get $lobits))))
      (local.set $ylo (i64.sub (local.get $ylo) (i64.shl (local.get $ylo1) (local.get $lobits))))
      (local.set $x
         (i64.add
           (i64.add
             (i64.mul (local.get $A) (local.get $xlo1))
             (i64.mul (local.get $B) (local.get $ylo1))
           )
           (i64.shl (local.get $x) (local.get $bits))
         )
      )
      (local.set $y
         (i64.add
           (i64.add
             (i64.mul (local.get $C) (local.get $xlo1))
             (i64.mul (local.get $D) (local.get $ylo1))
           )
           (i64.shl (local.get $y) (local.get $bits))
         )
      )
      (local.set $i (i32.sub (local.get $i) (i32.const 1)))
     )
    )
      (br_if $loop1 (i32.and (i32.ne (local.get $i) (i32.const 0)) (i64.ne (local.get $bits) (i64.const 0))))
    )
    (local.get $A)
    (local.get $B)
    (local.get $C)
    (local.get $D)
  )
)
`;

let wasmHelper = null;
if (globalThis.WebAssembly != null) {
  try {
    const f = new WebAssembly.Instance(new WebAssembly.Module(wast2wasm(wastCode2))).exports.helper;
    if (f(BigInt(1), BigInt(0), BigInt(1), BigInt(0)) != null) {
      wasmHelper = f;
    }
    DIGITSIZE = 64;
  } catch (error) {
    console.log(error);
  }
}


let previousValue = 0;
// some terrible optimization as bitLength is slow
function bitLength2(a) {
  if (previousValue <= 1024) {
    const n = Number(BigInt(a));
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

// 2**n
function exp2(n) {
  if (n < 0) {
    throw new RangeError();
  }
  let result = 1;
  while (n > 30) {
    n -= 30;
    result *= (1 << 30);
  }
  result *= (1 << n);
  return result;
}

function helper(X, Y) {
  if (typeof X !== 'bigint' || typeof Y !== 'bigint') {
    throw new TypeError();
  }
  if (!doubleDigitMethod) {
    if (wasmHelper != null) {
      if (Y === 0n) {
        return [1n, 0n, 0n, 1n];
      }
      return wasmHelper(X, 0n, Y, 0n);
    }
    return jsHelper(Number(X), 0, Number(Y), 0);
  }
  if (wasmHelper != null) {
    if (DIGITSIZE !== 64) {
      throw new RangeError();
    }
    const x = BigInt.asUintN(64, X >> 64n);
    const xlo = BigInt.asUintN(64, X);
    const y = BigInt.asUintN(64, Y >> 64n);
    const ylo = BigInt.asUintN(64, Y);
    if (y === 0n) {
      return [1n, 0n, 0n, 1n];
    }
    return wasmHelper(x, xlo, y, ylo);
  }
  const x = X >> BigInt(DIGITSIZE);
  const xlo = BigInt.asUintN(DIGITSIZE, X);
  const y = Y >> BigInt(DIGITSIZE);
  const ylo = BigInt.asUintN(DIGITSIZE, Y);
  return jsHelper(Number(x), Number(xlo), Number(y), Number(ylo));
}

function jsHelper(x, xlo, y, ylo) {

  // computes the transformation matrix, which is the product of all {{0, 1}, {1, -q}} matrices,
  // where q is the quotient produced by Euclid's algorithm for any pair of integers (a, b),
  // where a within [X << m; ((X + 1) << m) - 1] and b within [Y << m; ((Y + 1) << m) - 1]

  // 2x2-matrix transformation matrix of (x_initial, y_initial) into (x, y):
  let A = 1;
  let B = 0;
  let C = 0;
  let D = 1;

  let lobits = LOG2MAX;
  let bits = 1;
  for (let i = doubleDigitMethod ? 5 : 0; i >= 0 && bits !== 0; i -= 1) {

    let sameQuotient = y !== 0;
    while (sameQuotient) {
      //console.assert(y > 0);
      const q = Math.floor(+x / y);
      const y1 = x - q * y;
      // Multiply matrix augmented by column (x, y) by {{0, 1}, {1, -q}} from the right:
      const A1 = C;
      const B1 = D;
      const C1 = A - q * C;
      const D1 = B - q * D;
      // The quotient for a point (x_initial + alpha, y_initial + beta), where 0 <= alpha < 1 and 0 <= beta < 1:
      // floor((x + A * alpha + B * beta) / (y + C * alpha + D * beta))
      // As the sign(A) === -sign(B) === -sign(C) === sign(D) (ignoring zero entries) the maximum and minimum values are floor((x + A) / (y + C)) and floor((x + B) / (y + D))

      // floor((x + A) / (y + C)) === q  <=>  0 <= (x + A) - q * (y + C) < (y + C)  <=>  0 <= y1 + C1 < y + C
      // floor((x + B) / (y + D)) === q  <=>  0 <= (x + B) - q * (y + D) < (y + D)  <=>  0 <= y1 + D1 < y + D
      sameQuotient = 0 <= y1 + C1 && y1 + C1 < y + C &&
                     0 <= y1 + D1 && y1 + D1 < y + D;
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
    }

    if (i >= 1) {
      const b = LOG2MAX - 0 - log2(x + Math.max(A, B));
      bits = Math.min(Math.max(b, 0), lobits);
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
  return [BigInt(A), BigInt(B), BigInt(C), BigInt(D)];
}

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
    const m = BigInt(Math.max(0, n - DIGITSIZE * (doubleDigitMethod ? 2 : 1)));
    const [A1, B1, C1, D1] = helper(a >> m, b >> m);
    if (B1 === 0n) {
      //console.assert(A1 === 1n && B1 === 0n && C1 === 0n && D1 === 1n);
      //gcd.debug(a / b);
      [a, b] = [b, a % b];
    } else {
      [a, b] = [A1 * a + B1 * b, C1 * a + D1 * b]; // T * (a, b)
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
  if (i64gcd != null && Math.max(na, nb) < 2**64) {
    return BigInt.asUintN(64, i64gcd(A, B));
  }
  if (abmin > (Number.MAX_SAFE_INTEGER + 1) * (1 << 11)) {
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
