using Random
using Printf
using Dates

function randomBigInt(size)
    return rand(BigInt(0):BigInt(2)^size - 1)
end

function testRandomBigIntPerformance(w)
    for s in 6:(23)
        size=2^s
        e = 23 - floor(Int, round(log2(size))) + 1 + (w >= 2 ? 2 : 0)
        count = 2^max(e, 0)
        a = Vector{BigInt}(undef, count)
        b = Vector{BigInt}(undef, count)

        for i in 1:count
            a[i] = randomBigInt(w == 3 || w == 4 ? size * 2 : size)
            b[i] = randomBigInt(w == 3 || w == 4 ? size - 2 : size)
            #while (gcd(a[i], b[i]) != 1)
            #   b[i] += 1
            #end
        end

        start = now()
        sum = 0
        g = BigInt(0)
        for i in 1:count
            if (w == 0)
              g = gcd(a[i], b[i])
            end
            if (w == 1)
              #g, u, v = gcdx(a[i], b[i])
              g = invmod(a[i], b[i])
            end
            if (w == 2)
              g = a[i] * b[i]
            end
            if (w == 3)
              g = a[i] ÷ b[i]
            end
            if (w == 4)
              g = a[i] % b[i]
            end
            #if (w == 5)
            #  g = invmod(a[i], b[i])
            #end
            sum += Int(g & 0xFFFF)
        end
        elapsed = (now() - start) / Millisecond(1)
        @printf("%d %.5f0ms %d\n", size, elapsed / count, sum)
    end
end

testRandomBigIntPerformance(0)
testRandomBigIntPerformance(1)
testRandomBigIntPerformance(2)
testRandomBigIntPerformance(3)
testRandomBigIntPerformance(4)
#testRandomBigIntPerformance(5)
