const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
// 颜色输出
const colors = {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
};

// 日志输出函数
function cclog(text, color = 'white') {
    console.log(`${colors[color]}${text}${colors.reset}`);
}

// 执行命令函数
function executeCommon(command) {
    try {
        console.log(`执行命令: ${command}`);
        execSync(command, { stdio: 'inherit' });
    } catch (error) {
        cclog(`命令执行失败: ${command}`, 'red');
        process.exit(1);
    }
}

function modifyProtoJS() {
    cclog("修改js文件");
    // 修改 libbase中 build.gradle 的版本号
    const protojs_path = path.join("../", "assets", "script", "Socket", "proto", "proto.js")
    const content = fs.readFileSync(protojs_path, "utf-8");
    let index = content.indexOf(`var $protobuf = require("protobufjs/minimal");`);
    // 使用 var $protobuf = protobuf; 替换掉 var $protobuf = require("protobufjs/minimal");
    const newContent = content.replace(`var $protobuf = require("protobufjs/minimal");`, "var $protobuf = protobuf;");
    fs.writeFileSync(protojs_path, newContent);
    cclog("修改protojs完成");
}

// 主函数
function main() {
    // 修改当前工作目录为脚本所在目录
    process.chdir(__dirname);

    // 设置路径
    const absPath = process.cwd();
    const jsPath = path.join(absPath, '..', 'assets', 'script', 'Socket', 'proto', 'proto.js');
    const tsPath = path.join(absPath, '..', 'assets', 'script', 'Socket', 'proto', 'proto.d.ts');
    const protoPath = '*.proto';

    // 生成js文件，使用 commonjs 格式
    const jsCommand = `pbjs -t static-module -w commonjs -o ${jsPath} --no-verify --no-convert --no-delimited --no-beautify --no-create --no-typeurl --force-number ${protoPath}`;

    executeCommon(jsCommand);
    cclog('生成js文件成功', 'green');

    modifyProtoJS();
    
    // 生成.d.ts文件
    const tsCommand = `pbts --no-comments -o ${tsPath} ${jsPath}`;
    executeCommon(tsCommand);
    cclog('生成.d.ts文件成功', 'green');

    // 压缩 proto.js文件
    const uglifyCommand = `uglifyjs ${jsPath} -o ${jsPath}`;
    executeCommon(uglifyCommand);
    cclog('proto文件转换完成', 'green');
}

// 执行主函数
main(); 