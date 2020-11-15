# bigint-gcd
Greater common divisor (gcd) of two BigInt values using Lehmer's GCD algorithm.
See https://en.wikipedia.org/wiki/Greatest_common_divisor#Lehmer's_GCD_algorithm.
On my tests it is faster than Euclidean algorithm starting from 80-bit integers.

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

Benchmark:
==========

```javascript
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
// Chrome 86: default: 1000 ms
console.time();
for (let i = 0; i < count; i++) {
  if (EuclidsGCD(a * BigInt(i), b * BigInt(i)) != i) {
    throw new Error();
  }
}
console.timeEnd();
// Chrome 86: default: 2300 ms
```
