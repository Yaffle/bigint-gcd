import random
import gmpy2
from gmpy2 import gcd, invert, mpz
from datetime import datetime

def random_bigint(size):
    return mpz(random.getrandbits(size))

def test_random_bigint_performance(w):
    for s in range(6, 24):
        size = 2**s
        e = 23 - round(size.bit_length() - 1) + 1 + (2 if w >= 2 else 0)
        count = 2**max(e, 0)
        a = [None] * count
        b = [None] * count

        for i in range(count):
            a[i] = random_bigint(size * 2 if w in [3, 4] else size)
            b[i] = random_bigint(size - 2 if w in [3, 4] else size)

        start = datetime.now()
        total_sum = 0
        g = mpz(0)

        for i in range(count):
            if w == 0:
                g = gcd(a[i], b[i])
            elif w == 1:
                try:
                    g = invert(a[i], b[i])
                except ZeroDivisionError:
                    g = mpz(0)
            elif w == 2:
                g = a[i] * b[i]
            elif w == 3:
                g = a[i] // b[i]
            elif w == 4:
                g = a[i] % b[i]
            total_sum += int(g & 0xFFFF)

        elapsed = (datetime.now() - start).total_seconds() * 1000  # in milliseconds
        print(f"{size} {elapsed / count:.5f}ms {total_sum}")

# Test the performance for different operations
test_random_bigint_performance(0)
test_random_bigint_performance(1)
test_random_bigint_performance(2)
test_random_bigint_performance(3)
test_random_bigint_performance(4)