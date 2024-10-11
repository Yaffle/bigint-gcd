using Random
using Printf
using Dates

function randomBigInt(size)
    if size <= 52
        return big(floor(Int, rand() * 2^size))
    end
    q = ceil(Int, size / (2 * 52)) * 52
    return (randomBigInt(size - q) << big(q)) | randomBigInt(q)
end

#function randomBigInt(size)
#    return rand(BigInt(0):BigInt(2)^size - 1)
#end

function testRandomBigIntGCDPerformance()
    for s in 6:(23)
        size=2^s
        e = 23 - floor(Int, round(log2(size)))
        count = 2^max(e, 0)
        a = Vector{BigInt}(undef, count)
        b = Vector{BigInt}(undef, count)

        for i in 1:count
            a[i] = (randomBigInt(size) >> (size >= 2^20 ? big(64) : big(2))) * big(3)
            b[i] = (randomBigInt(size) >> (size >= 2^20 ? big(64) : big(2))) * big(3)
            #while (gcd(a[i], b[i]) != 1)
            #   b[i] += 1;
            #end
        end

        start = now()
        sum = 0
        for i in 1:count
            g = gcd(a[i], b[i])
            #g, u, v = gcdx(a[i], b[i])
            #g = invmod(a[i], b[i])
            sum += Int(g & 0xFFFF)
        end
        elapsed = (now() - start) / Millisecond(1)
        @printf("%d %.5f0ms %d\n", size, elapsed / count, sum)
    end
end

testRandomBigIntGCDPerformance();

