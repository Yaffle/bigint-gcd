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
|      64 |    0.000370ms |    0.000258ms |
|     128 |    0.003700ms |    0.000470ms |
|     256 |    0.006700ms |    0.001460ms |
|     512 |    0.011600ms |    0.003021ms |
|    1024 |    0.025000ms |    0.006235ms |
|    2048 |    0.060000ms |    0.013171ms |
|    4096 |    0.118000ms |    0.028502ms |
|    8192 |    0.280000ms |    0.066180ms |
|   16384 |    0.720000ms |    0.165383ms |
|   32768 |    2.120000ms |    0.459387ms |
|   65536 |    7.900000ms |    1.395260ms |
|  131072 |   15.300000ms |    3.836070ms |
|  262144 |   40.100000ms |   10.284430ms |
|  524288 |  101.000000ms |   27.697000ms |
| 1048576 |  251.000000ms |  123.401800ms |
| 2097152 |  608.000000ms |  185.817000ms |
| 4194304 | 1456.000000ms |  458.690400ms |
| 8388608 | 3418.000000ms | 1093.280500ms |

Benchmark:
==========

```javascript
// Copy-paste the code from gcd.js .
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
const a = FibonacciNumber(186n);
const b = FibonacciNumber(186n - 1n);
const count = 100000;
console.time();
for (let i = 0; i < count; i++) {
  if (LehmersGCD(a * BigInt(i), b * BigInt(i)) != i) {
    throw new Error();
  }
}
console.timeEnd();
// Chrome 86: default: 850 ms
console.time();
for (let i = 0; i < count; i++) {
  if (EuclidsGCD(a * BigInt(i), b * BigInt(i)) != i) {
    throw new Error();
  }
}
console.timeEnd();
// Chrome 86: default: 1900 ms
```
