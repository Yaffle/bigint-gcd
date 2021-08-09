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

The benchmark (see [benchmark.html](benchmark.html)) resutls under Chrome 93:

| bit size|    bigint-gcd | Julia 1.6.2 Win64 |
| ------- | ------------- | ----------------- |
|      64 |    0.002100ms |    0.000336ms     |
|     128 |    0.007200ms |    0.000564ms     |
|     256 |    0.012800ms |    0.001940ms     |
|     512 |    0.026100ms |    0.003866ms     |
|    1024 |    0.055000ms |    0.008034ms     |
|    2048 |    0.118000ms |    0.017292ms     |
|    4096 |    0.240000ms |    0.038458ms     |
|    8192 |    0.540000ms |    0.091198ms     |
|   16384 |    1.300000ms |    0.237015ms     |
|   32768 |    3.460000ms |    0.702380ms     |
|   65536 |   12.600000ms |    2.171570ms     |
|  131072 |   23.400000ms |    5.846590ms     |
|  262144 |   58.100000ms |   15.361400ms     |
|  524288 |  143.000000ms |   40.375300ms     |
| 1048576 |  350.000000ms |  101.624200ms     |
| 2097152 |  851.000000ms |  249.669400ms     |
| 4194304 | 2002.000000ms |  696.058400ms     |
| 8388608 | 4676.000000ms | 1883.789200ms     |


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
