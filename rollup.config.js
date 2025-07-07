import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from "@rollup/plugin-terser";

const licenseBanner = `/*!
 * Copyright 2025 Proctorio
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */`;

const name = 'Observe';
export default [
  // ESM build
  {
    input: 'src/index.js',
    output: {
      file: 'lib/index.esm.js',
      format: 'esm',
      sourcemap: true,
      banner: licenseBanner
    },
    plugins: [resolve(), commonjs(), terser({
      mangle: {
        reserved: [name]
      }
    })],
  },
  // CJS build
  {
    input: 'src/index.js',
    output: {
      file: 'lib/index.cjs.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'default',
      banner: licenseBanner,
    },
    plugins: [resolve(), commonjs(), terser()],
  },
  // IIFE build
  {
    input: 'src/index.js',
    output: {
      file: 'lib/index.min.js',
      format: 'iife',
      name,
      sourcemap: true,
      exports: 'default',
      esModule: false,
      banner: licenseBanner
    },
    plugins: [resolve(), commonjs(), terser()],
  },
];

