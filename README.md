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

| bit size|    bigint-gcd |   Julia 1.7.3 |
| ------- | ------------- | --------------|
|      64 |    0.000230ms |    0.000258ms |
|     128 |    0.001460ms |    0.000470ms |
|     256 |    0.002730ms |    0.001460ms |
|     512 |    0.005500ms |    0.003021ms |
|    1024 |    0.012200ms |    0.006235ms |
|    2048 |    0.029500ms |    0.013171ms |
|    4096 |    0.069000ms |    0.028502ms |
|    8192 |    0.176000ms |    0.066180ms |
|   16384 |    0.510000ms |    0.165383ms |
|   32768 |    1.640000ms |    0.459387ms |
|   65536 |    4.510000ms |    1.395260ms |
|  131072 |   11.640000ms |    3.836070ms |
|  262144 |   31.400000ms |   10.284430ms |
|  524288 |   85.100000ms |   27.697000ms |
| 1048576 |  208.600000ms |  123.401800ms |
| 2097152 |  501.000000ms |  185.817000ms |
| 4194304 | 1211.000000ms |  458.690400ms |
| 8388608 | 2877.000000ms | 1093.280500ms |

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
