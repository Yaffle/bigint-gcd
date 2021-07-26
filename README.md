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

| bit size|    bigint-gcd | GMP (under PHP) |
| ------- | ------------- | --------------- |
|      64 |    0.002460ms |    0.001062ms   |
|     128 |    0.007900ms |    0.001410ms   |
|     256 |    0.013800ms |    0.003883ms   |
|     512 |    0.026400ms |    0.007521ms   |
|    1024 |    0.056000ms |    0.014925ms   |
|    2048 |    0.118000ms |    0.031618ms   |
|    4096 |    0.244000ms |    0.067132ms   |
|    8192 |    0.600000ms |    0.154160ms   |
|   16384 |    1.400000ms |    0.379880ms   |
|   32768 |    3.570000ms |    1.091921ms   |
|   65536 |   14.900000ms |    2.882202ms   |
|  131072 |   24.500000ms |    7.760303ms   |
|  262144 |   62.400000ms |   21.194702ms   |
|  524288 |  161.000000ms |   59.014160ms   |
| 1048576 |  410.000000ms |  166.211670ms   |
| 2097152 |  939.000000ms |  430.083008ms   |
| 4194304 | 2462.000000ms | 1073.131836ms   |
| 8388608 | 5480.000000ms | 2697.668945ms   |


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
