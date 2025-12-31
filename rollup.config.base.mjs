import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

/**
 * 生成 Rollup 配置
 * @param {string} packageName - 包名 (e.g., 'bit-core', 'bit-ui')
 * @param {string[]} external - 外部依赖数组
 * @returns {Array} Rollup 配置数组
 */
export function createRollupConfig(packageName, external = ['cc']) {
  const tsPluginOptions = {
    tsconfig: './tsconfig.json',
    importHelpers: false,
    compilerOptions: {
      target: "es6",
      module: "es6",
      experimentalDecorators: true,
      strict: true,
      strictNullChecks: false,
      moduleResolution: "Node",
      skipLibCheck: true,
      esModuleInterop: true,
    }
  };

  return [
    {
      // 生成未压缩的 JS 文件
      input: 'src/index.ts',
      external,
      output: [
        {
          file: `dist/${packageName}.mjs`,
          format: 'esm',
          name: packageName
        },
        {
          file: `dist/${packageName}.cjs`,
          format: 'cjs',
          name: packageName
        }
      ],
      plugins: [typescript(tsPluginOptions)]
    },
    {
      // 生成压缩的 JS 文件
      input: 'src/index.ts',
      external,
      output: [
        {
          file: `dist/${packageName}.min.mjs`,
          format: 'esm',
          name: packageName
        },
        {
          file: `dist/${packageName}.min.cjs`,
          format: 'cjs',
          name: packageName
        }
      ],
      plugins: [
        typescript(tsPluginOptions),
        terser()
      ]
    },
    {
      // 生成声明文件的配置
      input: 'src/index.ts',
      output: {
        file: `dist/${packageName}.d.ts`,
        format: 'es'
      },
      plugins: [dts({
        compilerOptions: {
          stripInternal: true
        }
      })]
    }
  ];
}
