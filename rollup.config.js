import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

const production = !process.env.ROLLUP_WATCH;

export default [
  // Development build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/senangwebs_tour.js',
      format: 'umd',
      name: 'SWT',
      sourcemap: true
    },
    plugins: [
      resolve()
    ]
  },
  // Production build (minified)
  {
    input: 'src/index.js',
    output: {
      file: 'dist/senangwebs_tour.min.js',
      format: 'umd',
      name: 'SWT',
      sourcemap: false
    },
    plugins: [
      resolve(),
      terser()
    ]
  }
];
