import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

export default [
    {
        // 生成未压缩的 JS 文件
        input: 'src/index.ts',
        external: ['cc', 'fairygui-cc', '@gongxh/bit-core'],
        output: [
            {
                file: 'dist/bit-ui.mjs',
                format: 'esm',
                name: 'bit-ui'
            },
            {
                file: 'dist/bit-ui.cjs',
                format: 'cjs',
                name: 'bit-ui'
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
        external: ['cc', 'fairygui-cc', '@gongxh/bit-core'],
        output: [
            {
                file: 'dist/bit-ui.min.mjs',
                format: 'esm',
                name: 'bit-ui'
            },
            {
                file: 'dist/bit-ui.min.cjs',
                format: 'cjs',
                name: 'bit-ui'
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
            file: 'dist/bit-ui.d.ts',
            format: 'es'
        },
        plugins: [dts({
            compilerOptions: {
                stripInternal: true
            }
        })]
    }
];