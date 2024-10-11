# bigint-gcd
Greater common divisor (gcd) of two BigInt values using Lehmer's GCD algorithm.
See https://en.wikipedia.org/wiki/Greatest_common_divisor#Lehmer's_GCD_algorithm.
On my tests it is faster than Euclidean algorithm starting from 80-bit integers.

A version 1.0.2 also has something similar to "Subquadratic GCD" (see https://gmplib.org/manual/Subquadratic-GCD ),
which is faster for large bigints (> 65000 bits), it should has better time complexity in case 
the multiplication is subquadratic, which is true in Chrome 93.

Installation
============

```cmd
$ npm install bigint-gcd
```

Usage
=====

```
import gcd from './node_modules/bigint-gcd/gcd.js';

console.log(gcd(120n, 18n));

```

There is also an implementation of the Extended Euclidean algorithm, which is useful to find the multiplicative modular inverse:
```
console.log(gcd.gcdext(3n, 5n)); // [2n, -1n, 1n]
```

And "Half GCD" which is useful to do the [Rational reconstruction](https://en.wikipedia.org/wiki/Rational_reconstruction_(mathematics)):
It returns the transformation matrix and the transformed values after applying about half of the Euclidean steps.
```
console.log(gcd.halfgcd(1000000n, 1234567n)); // [-16n, 13n, 21n, -17n, 49371n, 12361n]
```



Performance:
============

The benchmark (see [benchmark.html](benchmark.html)) resutls under Opera 87:

|           bit size |                 gcd |    gcd Julia 1.7.3 |             gcdext |   gcdx Julia 1.7.3 | invmod Julia 1.7.3 |            halfgcd |
| ------------------ | ------------------- | ------------------ | ------------------ | ------------------ | ------------------ | ------------------ |
|                 64 |          0.000230ms |         0.000310ms |         0.000420ms |         0.002550ms |         0.002620ms |         0.002040ms |
|                128 |          0.001280ms |         0.000500ms |         0.002040ms |         0.004260ms |         0.001510ms |         0.005290ms |
|                256 |          0.002900ms |         0.001800ms |         0.004000ms |         0.002560ms |         0.002500ms |         0.008510ms |
|                512 |          0.005550ms |         0.003110ms |         0.007810ms |         0.004210ms |         0.004210ms |         0.011050ms |
|               1024 |          0.012450ms |         0.006350ms |         0.018070ms |         0.007930ms |         0.007930ms |         0.017460ms |
|               2048 |          0.029540ms |         0.012450ms |         0.045170ms |         0.016360ms |         0.015380ms |         0.038820ms |
|               4096 |          0.070800ms |         0.025390ms |         0.157230ms |         0.037110ms |         0.034180ms |         0.087400ms |
|               8192 |          0.172850ms |         0.069340ms |         0.388670ms |         0.095700ms |         0.086910ms |         0.207030ms |
|              16384 |          0.480470ms |         0.164060ms |         0.943360ms |         0.269530ms |         0.238280ms |         0.466800ms |
|              32768 |          1.582030ms |         0.468750ms |         2.468750ms |         0.828120ms |         0.738280ms |         1.152340ms |
|              65536 |          4.250000ms |         1.421880ms |         6.625000ms |         2.109380ms |         2.757810ms |         3.015630ms |
|             131072 |         11.156250ms |         3.796880ms |        17.953130ms |         5.671880ms |         4.953120ms |         8.015630ms |
|             262144 |         30.906250ms |        10.406250ms |        49.125000ms |        18.437500ms |        15.843750ms |        21.625000ms |
|             524288 |         81.437500ms |        33.187500ms |       128.750000ms |        43.875000ms |        40.750000ms |        54.500000ms |
|            1048576 |        199.250000ms |        75.375000ms |       325.125000ms |       124.750000ms |       107.625000ms |       135.000000ms |
|            2097152 |        484.000000ms |       185.500000ms |       804.250000ms |       302.000000ms |       279.750000ms |       331.250000ms |
|            4194304 |       1170.000000ms |       432.000000ms |      1936.500000ms |       762.500000ms |       687.500000ms |       793.000000ms |
|            8388608 |       2828.000000ms |      1081.000000ms |      4747.000000ms |      1798.000000ms |      1696.000000ms |      1902.000000ms |

Benchmark:
==========

```javascript
import {default as LehmersGCD} from './gcd.js';

function EuclideanGCD(a, b) {
  while (b !== 0n) {
    const r = a % b;
    a = b;
    b = r;
  }
  return a;
}

function ctz4(n) {
  return 31 - Math.clz32(n & -n);
}
const BigIntCache = new Array(32).fill(0n).map((x, i) => BigInt(i));
function ctz1(bigint) {
  return BigIntCache[ctz4(Number(BigInt.asUintN(32, bigint)))];
}
function BinaryGCD(a, b) {
  if (a === 0n) {
    return b;
  }
  if (b === 0n) {
    return a;
  }
  const k = ctz1(a | b);
  a >>= k;
  b >>= k;
  while (b !== 0n) {
    b >>= ctz1(b);
    if (a > b) {
      const t = b;
      b = a;
      a = t;
    }
    b -= a;
  }
  return k === 0n ? a : a << k;
}

function FibonacciNumber(n) {
  console.assert(n > 0);
  var a = 0n;
  var b = 1n;
  for (var i = 1; i < n; i += 1) {
    var c = a + b;
    a = b;
    b = c;
  }
  return b;
}

function RandomBigInt(size) {
  if (size <= 32) {
    return BigInt(Math.floor(Math.random() * 2**size));
  }
  const q = Math.floor(size / 2);
  return (RandomBigInt(size - q) << BigInt(q)) | RandomBigInt(q);
}

function test(a, b, f) {
  const g = EuclideanGCD(a, b);
  const count = 100000;
  console.time();
  for (let i = 0; i < count; i++) {
    const I = BigInt(i);
    if (f(a * I, b * I) !== g * I) {
      throw new Error();
    }
  }
  console.timeEnd();
}

const a1 = RandomBigInt(128);
const b1 = RandomBigInt(128);

test(a1, b1, LehmersGCD);
// default: 426.200927734375 ms
test(a1, b1, EuclideanGCD);
// default: 1136.77294921875 ms
test(a1, b1, BinaryGCD);
// default: 1456.793212890625 ms

const a = FibonacciNumber(186n);
const b = FibonacciNumber(186n - 1n);

test(a, b, LehmersGCD);
// default: 459.796875 ms
test(a, b, EuclideanGCD);
// default: 2565.871826171875 ms
test(a, b, BinaryGCD);
// default: 1478.333984375 ms

```
