#! /usr/bin/env node

const path = require("path");
const fs = require("fs-extra");
// 自定义交互命令工具库
const program = require("commander");
// 处理用户命令行输入
const inquirer = require("inquirer");
// 下载git模板
const downloadGitRepo = require("download-git-repo");

// 命令行loading动画库
const ora = require("ora");
// 获取包信息
const packageJson = require("../package.json");
// git模板信息
// const templates = require("./templates.cjs");
const { getGitReposList } = require("./api");

// 定义当前版本
program.version(`v${packageJson.version}`);

program
  .command("create [projectName]")
  .option("-t, --template", "模板名称")
  .description("创建模板")
  .action(async (projectName, option) => {
    // 添加获取模版列表接口和loading
    const getRepoLoading = ora("获取模版列表...");
    getRepoLoading.start();
    const templates = await getGitReposList("");
    getRepoLoading.succeed("获取模版列表成功!");

    // 从模版列表中找到对应的模版
    const inputTemplate = templates.find(
      (tmpl) => tmpl.name === option.template
    );
    // 如果匹配到模版就赋值，没有匹配到就是undefined
    let projectTemplate = inputTemplate ? inputTemplate.value : undefined;
    console.log("命令行参数：", projectName, projectTemplate);

    // 如果用户没有传入名称就交互式输入
    if (!projectName) {
      // 输入项目名称
      const { name } = await inquirer.prompt({
        type: "input",
        name: "name",
        message: "请输入项目名称:",
      });
      // 赋值输入的项目名称
      projectName = name;
    }
    console.log("项目名称:", projectName);

    // 如果用户没有传入模版就交互式输入
    if (!projectTemplate) {
      // 选择git模板
      const { template } = await inquirer.prompt({
        type: "list",
        name: "template",
        message: "请选择模板:",
        choices: templates,
      });
      // 赋值选择的项目名称
      projectTemplate = template;
    }

    console.log("模版:", template);

    // 获取目标文件夹
    const dest = path.join(process.cwd(), projectName);
    //判断文件夹是否存在，存在就交互询问用户是否覆盖
    if (fs.existsSync(dest)) {
      const { force } = await inquirer.prompt({
        type: "confirm",
        name: "force",
        message: "目录已存在，是否覆盖？",
      });
      // 如果覆盖就删除文件夹继续往下执行，否的话就退出进程
      force ? fs.removeSync(dest) : process.exit(1);
    }
    // 定义loading
    const loading = ora("正在下载模板...");
    // 开始loading
    loading.start();
    // 下载模板
    downloadGitRepo(projectTemplate, dest, (err) => {
      if (err) {
        // 失败loading
        loading.fail(`创建模板失败: ${err.message}`);
      } else {
        // 成功loading;
        loading.succeed(`创建模板成功`);

        // 添加引导信息(每个模版可能都不一样，要按照模版具体情况来)
        console.log(`\ncd ${projectName}`);
        console.log("npm i");
        console.log("npm start\n");
      }
    });
  });

//
program.on("--help", () => {});
// 解析命令行参数
program.parse(process.argv);
