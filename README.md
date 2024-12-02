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

|           bit size |                 gcd |    gcd Julia 1.7.3 |             gcdext |   gcdx Julia 1.7.3 |                mul |    mul Julia 1.7.3 |                div |    div Julia 1.7.3 |                rem |    rem Julia 1.7.3 |
| ------------------ | ------------------- | ------------------ | ------------------ | ------------------ | ------------------ | ------------------ | ------------------ | ------------------ | ------------------ | ------------------ |
|                 64 |          0.000260ms |         0.001240ms |         0.000470ms |         0.001480ms |         0.000060ms |         0.000850ms |         0.000080ms |         0.001060ms |         0.000070ms |         0.000910ms |
|                128 |          0.001190ms |         0.001810ms |         0.002110ms |         0.003110ms |         0.000060ms |         0.001080ms |         0.000330ms |         0.001320ms |         0.000390ms |         0.000540ms |
|                256 |          0.002700ms |         0.001650ms |         0.004530ms |         0.005520ms |         0.000080ms |         0.001730ms |         0.000380ms |         0.002090ms |         0.000400ms |         0.000630ms |
|                512 |          0.005490ms |         0.003170ms |         0.009090ms |         0.004300ms |         0.000150ms |         0.003490ms |         0.000690ms |         0.000670ms |         0.000730ms |         0.000690ms |
|               1024 |          0.012080ms |         0.006410ms |         0.018620ms |         0.008060ms |         0.000460ms |         0.000730ms |         0.001280ms |         0.009310ms |         0.001310ms |         0.001010ms |
|               2048 |          0.032710ms |         0.013550ms |         0.045530ms |         0.032960ms |         0.001220ms |         0.001100ms |         0.003600ms |         0.001340ms |         0.003660ms |         0.001650ms |
|               4096 |          0.067380ms |         0.029300ms |         0.152590ms |         0.037350ms |         0.003660ms |         0.002200ms |         0.010250ms |         0.002560ms |         0.010250ms |         0.003780ms |
|               8192 |          0.169920ms |         0.066410ms |         0.384770ms |         0.097660ms |         0.010990ms |         0.005370ms |         0.028560ms |         0.037350ms |         0.028810ms |         0.010500ms |
|              16384 |          0.489260ms |         0.166020ms |         0.968750ms |         0.271480ms |         0.035160ms |         0.014160ms |         0.080080ms |         0.075680ms |         0.080080ms |         0.027830ms |
|              32768 |          1.589840ms |         0.460940ms |         2.576170ms |         0.833980ms |         0.098630ms |         0.038090ms |         0.228520ms |         0.059570ms |         0.229490ms |         0.080080ms |
|              65536 |          4.304690ms |         1.394530ms |         7.019530ms |         2.421880ms |         0.296880ms |         0.337890ms |         0.658200ms |         0.177730ms |         0.660160ms |         0.226560ms |
|             131072 |         11.578130ms |         3.875000ms |        19.179690ms |         6.273440ms |         0.585940ms |         0.277340ms |         1.910160ms |         0.945310ms |         1.910160ms |         0.750000ms |
|             262144 |         31.765630ms |        11.828120ms |        52.890630ms |        16.890620ms |         1.312500ms |         1.156250ms |         5.023440ms |         1.445310ms |         5.023440ms |         2.351560ms |
|             524288 |         87.500000ms |        27.875000ms |       137.968750ms |        46.218750ms |         3.078130ms |         1.421880ms |        12.828130ms |         4.234380ms |        12.781250ms |         6.781250ms |
|            1048576 |        212.500000ms |        71.375000ms |       344.812500ms |       118.562500ms |         6.812500ms |         3.187500ms |        30.781250ms |        10.343750ms |        30.718750ms |        13.312500ms |
|            2097152 |        510.875000ms |       203.125000ms |       857.000000ms |       317.500000ms |        17.562500ms |         9.437500ms |        75.750000ms |        21.000000ms |        75.812500ms |        36.937500ms |
|            4194304 |       1235.500000ms |       435.500000ms |      2068.500000ms |       702.000000ms |        39.125000ms |        18.375000ms |       184.500000ms |        40.250000ms |       176.375000ms |        50.500000ms |
|            8388608 |       2965.500000ms |      1028.500000ms |      4970.000000ms |      1730.000000ms |        90.500000ms |        46.500000ms |       407.750000ms |        90.750000ms |       406.500000ms |        94.250000ms |


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
