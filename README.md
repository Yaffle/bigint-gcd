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

The benchmark (see [benchmark.html](benchmark.html)) resutls under Chrome 131:

|           bit size |                 gcd |          gmpy2 gcd |             invmod |       gmpy2 invert |
| ------------------ | ------------------- | ------------------ | ------------------ | ------------------ |
|                 64 |          0.000270ms |          0.00030ms |         0.000310ms |          0.00066ms |
|                128 |          0.001270ms |          0.00047ms |         0.001720ms |          0.00137ms |
|                256 |          0.002660ms |          0.00153ms |         0.003650ms |          0.00224ms |
|                512 |          0.005460ms |          0.00321ms |         0.007630ms |          0.00391ms |
|               1024 |          0.012080ms |          0.00653ms |         0.018250ms |          0.00806ms |
|               2048 |          0.031130ms |          0.01429ms |         0.048220ms |          0.01587ms |
|               4096 |          0.067870ms |          0.02979ms |         0.137700ms |          0.03590ms |
|               8192 |          0.174320ms |          0.06837ms |         0.341310ms |          0.09035ms |
|              16384 |          0.503910ms |          0.17093ms |         0.867190ms |          0.24908ms |
|              32768 |          1.677730ms |          0.49816ms |         2.281250ms |          0.75801ms |
|              65536 |          4.406250ms |          1.43795ms |         6.152340ms |          1.94962ms |
|             131072 |         11.828130ms |          3.98527ms |        16.937500ms |          4.98559ms |
|             262144 |         32.296880ms |         10.52619ms |        47.203130ms |         14.05025ms |
|             524288 |         86.625000ms |         28.16362ms |       123.500000ms |         38.94622ms |
|            1048576 |        213.312500ms |         70.89262ms |       310.062500ms |        103.71075ms |
|            2097152 |        519.250000ms |        177.16650ms |       773.875000ms |        269.43650ms |
|            4194304 |       1255.750000ms |        433.85675ms |      1870.500000ms |        658.39875ms |
|            8388608 |       2988.500000ms |       1069.74050ms |      4548.000000ms |       1673.88250ms |

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
