import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';
import postcss from 'rollup-plugin-postcss';
import postcssImport from 'postcss-import';

const production = !process.env.ROLLUP_WATCH;

export default [
  // Viewer Library - Development build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/swt.js',
      format: 'umd',
      name: 'SWT',
      sourcemap: true
    },
    plugins: [
      resolve()
    ]
  },
  // Viewer Library - Production build (minified)
  {
    input: 'src/index.js',
    output: {
      file: 'dist/swt.min.js',
      format: 'umd',
      name: 'SWT',
      sourcemap: false
    },
    plugins: [
      resolve(),
      terser()
    ]
  },
  // Editor - JavaScript bundle (development)
  {
    input: 'src/editor/editor-entry.js',
    output: {
      file: 'dist/swt-editor.js',
      format: 'iife',
      sourcemap: true
    },
    plugins: [
      resolve(),
      json()
    ]
  },
  // Editor - JavaScript bundle (minified)
  {
    input: 'src/editor/editor-entry.js',
    output: {
      file: 'dist/swt-editor.min.js',
      format: 'iife',
      sourcemap: false
    },
    plugins: [
      resolve(),
      json(),
      terser()
    ]
  },
  // Editor - CSS bundle
  {
    input: 'src/editor/editor-entry.css',
    output: {
      file: 'dist/swt-editor.css'
    },
    plugins: [
      postcss({
        extract: true,
        minimize: false,
        sourceMap: true,
        plugins: [postcssImport()]
      })
    ]
  },
  // Editor - CSS bundle (minified)
  {
    input: 'src/editor/editor-entry.css',
    output: {
      file: 'dist/swt-editor.min.css'
    },
    plugins: [
      postcss({
        extract: true,
        minimize: true,
        sourceMap: false,
        plugins: [postcssImport()]
      })
    ]
  }
];
