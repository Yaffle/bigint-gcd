const { readFileSync, writeFileSync } = require("fs");
const wabt = require("wabt");
const path = require("path");

const inputWat = "./wasmHelper.wat";
const outputWasm = "./wasmHelper.wasm";


require("wabt")().then(wabt => {
  const wasmModule = wabt.parseWat(inputWat, readFileSync(inputWat, "utf8"), {simd: true});
  const { buffer } = wasmModule.toBinary({log: true, write_debug_names: true});

  writeFileSync(outputWasm, new Buffer(buffer));

});