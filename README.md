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
import bigIntGCD from './node_modules/bigint-gcd/gcd.js';

console.log(bigIntGCD(120n, 18n));
```


Performance:
============

The benchmark (see [benchmark.html](benchmark.html)) resutls under Opera 87:

| bit size|    bigint-gcd |   Julia 1.7.3 |
| ------- | ------------- | --------------|
|      64 |    0.000300ms |    0.000258ms |
|     128 |    0.003500ms |    0.000470ms |
|     256 |    0.004700ms |    0.001460ms |
|     512 |    0.009300ms |    0.003021ms |
|    1024 |    0.020000ms |    0.006235ms |
|    2048 |    0.055000ms |    0.013171ms |
|    4096 |    0.100000ms |    0.028502ms |
|    8192 |    0.240000ms |    0.066180ms |
|   16384 |    0.990000ms |    0.165383ms |
|   32768 |    2.040000ms |    0.459387ms |
|   65536 |    6.200000ms |    1.395260ms |
|  131072 |   13.000000ms |    3.836070ms |
|  262144 |   36.500000ms |   10.284430ms |
|  524288 |   91.000000ms |   27.697000ms |
| 1048576 |  224.000000ms |  123.401800ms |
| 2097152 |  573.000000ms |  185.817000ms |
| 4194304 | 1276.000000ms |  458.690400ms |
| 8388608 | 3012.000000ms | 1093.280500ms |

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
