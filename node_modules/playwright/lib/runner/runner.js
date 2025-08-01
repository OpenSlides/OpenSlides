"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var runner_exports = {};
__export(runner_exports, {
  Runner: () => Runner
});
module.exports = __toCommonJS(runner_exports);
var import_lastRun = require("./lastRun");
var import_projectUtils = require("./projectUtils");
var import_reporters = require("./reporters");
var import_tasks = require("./tasks");
var import_gitCommitInfoPlugin = require("../plugins/gitCommitInfoPlugin");
var import_webServerPlugin = require("../plugins/webServerPlugin");
var import_base = require("../reporters/base");
var import_internalReporter = require("../reporters/internalReporter");
var import_compilationCache = require("../transform/compilationCache");
class Runner {
  constructor(config) {
    this._config = config;
  }
  async listTestFiles(projectNames) {
    const projects = (0, import_projectUtils.filterProjects)(this._config.projects, projectNames);
    const report = {
      projects: []
    };
    for (const project of projects) {
      report.projects.push({
        name: project.project.name,
        testDir: project.project.testDir,
        use: { testIdAttribute: project.project.use.testIdAttribute },
        files: await (0, import_projectUtils.collectFilesForProject)(project)
      });
    }
    return report;
  }
  async runAllTests() {
    const config = this._config;
    const listOnly = config.cliListOnly;
    (0, import_gitCommitInfoPlugin.addGitCommitInfoPlugin)(config);
    (0, import_webServerPlugin.webServerPluginsForConfig)(config).forEach((p) => config.plugins.push({ factory: p }));
    const reporters = await (0, import_reporters.createReporters)(config, listOnly ? "list" : "test", false);
    const lastRun = new import_lastRun.LastRunReporter(config);
    if (config.cliLastFailed)
      await lastRun.filterLastFailed();
    const reporter = new import_internalReporter.InternalReporter([...reporters, lastRun]);
    const tasks = listOnly ? [
      (0, import_tasks.createLoadTask)("in-process", { failOnLoadErrors: true, filterOnly: false }),
      (0, import_tasks.createReportBeginTask)()
    ] : [
      (0, import_tasks.createApplyRebaselinesTask)(),
      ...(0, import_tasks.createGlobalSetupTasks)(config),
      (0, import_tasks.createLoadTask)("in-process", { filterOnly: true, failOnLoadErrors: true }),
      ...(0, import_tasks.createRunTestsTasks)(config)
    ];
    const status = await (0, import_tasks.runTasks)(new import_tasks.TestRun(config, reporter), tasks, config.config.globalTimeout);
    await new Promise((resolve) => process.stdout.write("", () => resolve()));
    await new Promise((resolve) => process.stderr.write("", () => resolve()));
    return status;
  }
  async findRelatedTestFiles(files) {
    const errorReporter = (0, import_reporters.createErrorCollectingReporter)(import_base.terminalScreen);
    const reporter = new import_internalReporter.InternalReporter([errorReporter]);
    const status = await (0, import_tasks.runTasks)(new import_tasks.TestRun(this._config, reporter), [
      ...(0, import_tasks.createPluginSetupTasks)(this._config),
      (0, import_tasks.createLoadTask)("in-process", { failOnLoadErrors: true, filterOnly: false, populateDependencies: true })
    ]);
    if (status !== "passed")
      return { errors: errorReporter.errors(), testFiles: [] };
    return { testFiles: (0, import_compilationCache.affectedTestFiles)(files) };
  }
  async runDevServer() {
    const reporter = new import_internalReporter.InternalReporter([(0, import_reporters.createErrorCollectingReporter)(import_base.terminalScreen, true)]);
    const status = await (0, import_tasks.runTasks)(new import_tasks.TestRun(this._config, reporter), [
      ...(0, import_tasks.createPluginSetupTasks)(this._config),
      (0, import_tasks.createLoadTask)("in-process", { failOnLoadErrors: true, filterOnly: false }),
      (0, import_tasks.createStartDevServerTask)(),
      { title: "wait until interrupted", setup: async () => new Promise(() => {
      }) }
    ]);
    return { status };
  }
  async clearCache() {
    const reporter = new import_internalReporter.InternalReporter([(0, import_reporters.createErrorCollectingReporter)(import_base.terminalScreen, true)]);
    const status = await (0, import_tasks.runTasks)(new import_tasks.TestRun(this._config, reporter), [
      ...(0, import_tasks.createPluginSetupTasks)(this._config),
      (0, import_tasks.createClearCacheTask)(this._config)
    ]);
    return { status };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Runner
});
