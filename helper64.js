
export function helper(x:u64, xlo:u64, y:u64, ylo:u64, lobits:i32):i32 {
  // computes the transformation matrix, which is the product of all {{0, 1}, {1, -q_i}} matrices,
  // where q_i are the quotients produced by Euclidean algorithm for any pair of integers (a, b),
  // where a within [x, x + 1] and b within [y, y + 1]

  // 2x2-matrix transformation matrix of (x_initial, y_initial) into (x, y):
  let A = i64(1);
  let B = i64(0);
  let C = i64(0);
  let D = i64(1);

  let i = 0;

  let bits = 0;
  if (u64(y) != u64(0) && u64(x) != u64(-1)) { //! overflow when x == u64(-1)
    do {
      // switch from a matrix to pairs of (xmin,xmax) and (ymin,ymax):
      // any pair of initial integers looks like: (x_initial + alpha, y_initial + beta), where 0 <= alpha < 1 and 0 <= beta < 1
      // if we multiply transformation by it we get (x + alpha * A + beta * B, y + alpha * C + beta * D)
      // as A,B and C,D have different signs, and the signs are changed after every Euclidean step, then:
      //console.assert(sign(A) !== sign(B) && sign(C) !== sign(D));
      //console.assert(sign(A) !== sign(C) && sign(B) !== sign(D));
      let xmin = u64(x + B);
      let xmax = u64(x + A);
      let ymin = u64(y + C);
      let ymax = u64(y + D);
      if ((i & 1) != 0) {
        const xmin0 = xmin;
        xmin = xmax;
        xmax = xmin0;
        const ymin0 = ymin;
        ymin = ymax;
        ymax = ymin0;
      }
      do {
        const q = u64(u64(xmin) / u64(ymax));
        // The quotient for any pair (x,y) is within floor(xmin / ymax) and floor(xmax / ymin) as x > 0 and y > 0
        // So we need to check that u64(xmax / ymin) == q if q === u64(xmax / ymin):
        // 0 <= xmax - q * ymin < ymin
        if (!(xmax >= u64(q * ymin) && u64(xmax - u64(q * ymin)) < ymin)) {
          // not same quotient
          break;
        }
        // continue Euclidean step:
        i = i + 1;
        const ymin1 = u64(xmin - u64(q * ymax));
        const ymax1 = u64(xmax - u64(q * ymin));
        const y1 = u64(x - u64(q * y));
        xmin = ymin;
        xmax = ymax;
        x = y;
        ymin = ymin1;
        ymax = ymax1;
        y = y1;
        //console.debug(q);
      } while (true);
      // switch back to the matrix:
      A = i64(xmax - x);
      B = i64(xmin - x);
      C = i64(ymin - y);
      D = i64(ymax - y);
      if ((i & 1) != 0) {
        const A0 = A;
        A = B;
        B = A0;
        const C0 = C;
        C = D;
        D = C0;
      }

      // add more bits from xlo and ylo:
      bits = i32(i64.clz(u64(x + (A > B ? A : B)))); // xmax ?
      bits = lobits < bits ? lobits : bits;
      if (bits != 0) {
        const s = lobits - bits;
        const xlo1 = u64(xlo >> u64(s));
        const ylo1 = u64(ylo >> u64(s));
        xlo = u64(xlo - u64(xlo1 << u64(s)));
        ylo = u64(ylo - u64(ylo1 << u64(s)));
        x = u64(u64(u64(A * xlo1) + u64(B * ylo1)) + u64(x << u64(bits)));
        y = u64(u64(u64(C * xlo1) + u64(D * ylo1)) + u64(y << u64(bits)));
        lobits = s;
      }
    } while (bits != 0);
  }
  // AssemblyScript does not support multi-value return
  // while it is a faster way to return 4 values and without using a memory
  // it is possible to compile AssemblyScript to wat, then modify it, then use wat2wasm to compile into wasm.
  gA = A;
  gB = B;
  gC = C;
  gD = D;
  return 0;
}

export let gA = i64(0);
export let gB = i64(0);
export let gC = i64(0);
export let gD = i64(0);
