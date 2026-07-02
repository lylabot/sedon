import * as fs from 'node:fs'
import * as esbuild from 'esbuild'
import {sassPlugin} from 'esbuild-sass-plugin'
import postcss from 'postcss'
import autoprefixer from 'autoprefixer'
import postcssUrl from 'postcss-url'

const configJs = {
  entryPoints: ['./test/test.js'],
  loader: {
    '.svg': 'text',
  },
  bundle: true,
  outfile: './test/test.bundle.js',
  target: 'es2020',
  metafile: true,
  minify: process.env.NODE_ENV !== 'watch',
  treeShaking: process.env.NODE_ENV !== 'watch',
  sourcemap: process.env.NODE_ENV === 'watch' ? 'inline' : false,
}

const configCss = {
  entryPoints: ['./lib/base-styles.scss', './lib/sedon-classic/sedon-classic.scss'],
  loader: {
    '.svg': 'dataurl',
  },
  bundle: true,
  outdir: 'styles',
  format: 'esm',
  minify: process.env.NODE_ENV !== 'watch',
  treeShaking: process.env.NODE_ENV !== 'watch',
  sourcemap: process.env.NODE_ENV === 'watch' ? 'inline' : false,
  plugins: [sassPlugin({
    filter: /\.scss$/,
    type: 'css-text',
    async transform(source, _, from) {
      return (await postcss([autoprefixer, postcssUrl({
        url: 'inline',
        encodeType: 'base64',
        /**
        * @param contents {Buffer}
        * @param asset {PostcssUrl~Asset}
         * */
        transformContents(contents, asset) {
          const color = asset.url.match(/#(.+)$/)?.[1]
          return Buffer.from(contents.toString('utf8').replace('<svg', `<svg color="${color}"`))
        }
      })]).process(source, {from})).css
    },
  })],
}

if (process.env.NODE_ENV === 'watch') {
  await (await esbuild.context(configJs)).watch({})
  await (await esbuild.context(configCss)).watch({})
} else {
  const result = await esbuild.build({
    entryPoints: ['./src/index.ts'],
    loader: {
      '.svg': 'text',
    },
    bundle: true,
    outfile: './dist/index.min.js',
    target: 'es2020',
    platform: 'browser',
    format: 'iife',
    globalName: 'sedon',
    metafile: true,
    minify: true,
    treeShaking: true,
    sourcemap: 'linked',
    // external: ['@iconify-json/tabler']
  })
  await esbuild.build(configJs)
  await esbuild.build(configCss)
  fs.writeFileSync('meta.json', JSON.stringify(result.metafile))
}
