'use strict';

var path = require('path');
var chalk = require('chalk');
var yosay = require('yosay');
var extend = require('deep-extend');
var s = require('underscore.string');
var yeoman = require('yeoman-generator');
var fs = require('fs-extra');
var moment = require('moment');

var logger = require('./logger');
var utils = require('./utils');


// Global Variables
var folder, folderPath;

module.exports = yeoman.Base.extend({

  /**
   * init
   */
  init() {
    this.conflicter.force = true; // 冲突直接替换, 不再询问
  },

  /**
   * 检查git是否安装
   */
  checkForGit() {
    return utils.exec('git --version');
  },

  /**
   * 打印欢迎信息
   */
  welcomeMessage() {
    logger.log(yosay(
      'Welcome to the ' + chalk.red('generator-gf-panel') + ' generator!'
    ));
  },

  /**
   * 询问项目的所在目录名
   */
  promptForFolder() {
    var prompt = {
      name   : 'folder',
      message: 'In which folder would you like the grafana panel plugin project to be generated? ',
      default: 'xxx-panel'
    };

    return this.prompt(prompt).then(props => {
      folder = props.folder;
      folderPath = './' + folder + '/';
    });
  },

  /**
   * Clone seed project
   */
  cloneRepo() {
    logger.green('Cloning the remote seed repo.......');
    return utils.exec('git clone https://github.com/daniel-dx/grafana-panel-plugin-seed.git --branch master --single-branch ' + folder);
  },

  /**
   * 删除clone下来的种子项目的git信息
   */
  rmGitInfo() {
    fs.removeSync(folderPath + '.git');
  },

  /**
   * 询问项目的基本信息
   */
  getPrompts() {

    var prompts = [{
      name   : 'appName',
      message: 'What would you like to call your panel plugin?',
      default: folder
    }, {
      name   : 'appDescription',
      message: 'How would you describe your panel plugin?',
      default: folder + ' plugin for grafana'
    }, {
      name   : 'appKeywords',
      message: 'How would you describe your panel plugin in comma seperated keywords?',
      default: 'grafana panel plugin'
    }, {
      name   : 'appAuthor',
      message: 'What is your company/author name?'
    }];

    return this.prompt(prompts).then(props => {
      this.appName = props.appName;
      this.appDescription = props.appDescription;
      this.appKeywords = props.appKeywords;
      this.appAuthor = props.appAuthor;

      this.slugifiedAppName = s(this.appName).underscored().slugify().value(); // demo-name
      this.camelAppName = s(this.slugifiedAppName).camelize().value(); // demoName
      this.firstCapCamelAppName = s(this.camelAppName).capitalize().value(); // DemoName
      this.humanizedAppName = s(this.slugifiedAppName).humanize().value(); // Demo name
      this.titleAppName = s(this.humanizedAppName).titleize().value(); // Demo Name
    });
  },

  /**
   * 更新package.json数据
   */
  updatePackage() {
    var pkg = this.fs.readJSON(this.destinationPath(folder + '/package.json'), {});
    extend(pkg, {
      name: this.slugifiedAppName,
      description: this.appDescription,
      author: this.appAuthor,
      keywords: this.appKeywords.split(',')
    });
    this.fs.writeJSON(this.destinationPath(folder + '/package.json'), pkg);
  },

  /**
   * 替换关键字标识
   */
  replaceKeywords() {
    utils.replaceFiles(folder,
      {
        'Daniel Panel': this.titleAppName,
        'daniel-panel':  this.slugifiedAppName,
        'Danniel panel': this.humanizedAppName,
        '\\[author name\\]': this.appAuthor,
        '\\[current date\\]': moment().format('YYYY-MM-DD'),
      },
      [
        'node_modules/**'
      ])
  },

  /**
   * 安装依赖module
   */
  installing() {
    logger.green('Running npm install for you....');
    logger.green('This may take a couple minutes.');

    utils.exec('cd ' + folder).then(() => {
      this.installDependencies({
        bower: false,
        npm: true,
        callback: function () {
          logger.log('');
          logger.green('------------------------------------------');
          logger.green('Your application project is ready!');
          logger.log('');
          logger.green('To Get Started, run the following command:');
          logger.log('');
          logger.yellow('cd ' + folder + ' && npm run dev'); // TODO 根据实际情况进行修改
          logger.log('');
          logger.green('Happy Hacking!');
          logger.green('------------------------------------------');
        }
      });
    });
  }
});
