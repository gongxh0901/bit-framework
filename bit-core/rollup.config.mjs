import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

export default [
    {
        // 生成未压缩的 JS 文件
        input: 'src/index.ts',
        external: ['cc'],
        output: [
            {
                file: 'dist/bit-core.mjs',
                format: 'esm',
                name: 'bit-core'
            },
            {
                file: 'dist/bit-core.cjs',
                format: 'cjs',
                name: 'bit-core'
            }
        ],
        plugins: [
            typescript({
                tsconfig: './tsconfig.json',
                importHelpers: false,
                compilerOptions: {
                    target: "es6",
                    module: "es6",
                    experimentalDecorators: true, // 启用ES装饰器。
                    strict: true,
                    strictNullChecks: false,
                    moduleResolution: "Node",
                    skipLibCheck: true,
                    esModuleInterop: true,
                }
            })
        ]
    },
    {
        // 生成压缩的 JS 文件
        input: 'src/index.ts',
        external: ['cc'],
        output: [
            {
                file: 'dist/bit-core.min.mjs',
                format: 'esm',
                name: 'bit-core'
            },
            {
                file: 'dist/bit-core.min.cjs',
                format: 'cjs',
                name: 'bit-core'
            }
        ],
        plugins: [
            typescript({
                tsconfig: './tsconfig.json',
                importHelpers: false,
                compilerOptions: {
                    target: "es6",
                    module: "es6",
                    experimentalDecorators: true, // 启用ES装饰器。
                    strict: true,
                    strictNullChecks: false,
                    moduleResolution: "Node",
                    skipLibCheck: true,
                    esModuleInterop: true,
                }
            }),
            terser()
        ]
    },
    {
        // 生成声明文件的配置
        input: 'src/index.ts',
        output: {
            file: 'dist/bit-core.d.ts',
            format: 'es'
        },
        plugins: [dts({
            compilerOptions: {
                stripInternal: true
            }
        })]
    }
];