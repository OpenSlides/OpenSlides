"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var testServer_exports = {};
__export(testServer_exports, {
  TestServerDispatcher: () => TestServerDispatcher,
  resolveCtDirs: () => resolveCtDirs,
  runTestServer: () => runTestServer,
  runUIMode: () => runUIMode
});
module.exports = __toCommonJS(testServer_exports);
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_util = __toESM(require("util"));
var import_server = require("playwright-core/lib/server");
var import_utils = require("playwright-core/lib/utils");
var import_utilsBundle = require("playwright-core/lib/utilsBundle");
var import_reporters = require("./reporters");
var import_sigIntWatcher = require("./sigIntWatcher");
var import_tasks = require("./tasks");
var import_configLoader = require("../common/configLoader");
var import_fsWatcher = require("../fsWatcher");
var import_teleReceiver = require("../isomorphic/teleReceiver");
var import_gitCommitInfoPlugin = require("../plugins/gitCommitInfoPlugin");
var import_webServerPlugin = require("../plugins/webServerPlugin");
var import_base = require("../reporters/base");
var import_internalReporter = require("../reporters/internalReporter");
var import_list = __toESM(require("../reporters/list"));
var import_compilationCache = require("../transform/compilationCache");
var import_util2 = require("../util");
const originalDebugLog = import_utilsBundle.debug.log;
const originalStdoutWrite = process.stdout.write;
const originalStderrWrite = process.stderr.write;
class TestServer {
  constructor(configLocation, configCLIOverrides) {
    this._configLocation = configLocation;
    this._configCLIOverrides = configCLIOverrides;
  }
  async start(options) {
    this._dispatcher = new TestServerDispatcher(this._configLocation, this._configCLIOverrides);
    return await (0, import_server.startTraceViewerServer)({ ...options, transport: this._dispatcher.transport });
  }
  async stop() {
    await this._dispatcher?._setInterceptStdio(false);
    await this._dispatcher?.runGlobalTeardown();
  }
}
class TestServerDispatcher {
  constructor(configLocation, configCLIOverrides) {
    this._watchedProjectDirs = /* @__PURE__ */ new Set();
    this._ignoredProjectOutputs = /* @__PURE__ */ new Set();
    this._watchedTestDependencies = /* @__PURE__ */ new Set();
    this._queue = Promise.resolve();
    this._serializer = require.resolve("./uiModeReporter");
    this._watchTestDirs = false;
    this._closeOnDisconnect = false;
    this._populateDependenciesOnList = false;
    this._configLocation = configLocation;
    this._configCLIOverrides = configCLIOverrides;
    this.transport = {
      onconnect: () => {
      },
      dispatch: (method, params) => this[method](params),
      onclose: () => {
        if (this._closeOnDisconnect)
          (0, import_utils.gracefullyProcessExitDoNotHang)(0);
      }
    };
    this._watcher = new import_fsWatcher.Watcher((events) => {
      const collector = /* @__PURE__ */ new Set();
      events.forEach((f) => (0, import_compilationCache.collectAffectedTestFiles)(f.file, collector));
      this._dispatchEvent("testFilesChanged", { testFiles: [...collector] });
    });
    this._dispatchEvent = (method, params) => this.transport.sendEvent?.(method, params);
  }
  async _wireReporter(messageSink) {
    return await (0, import_reporters.createReporterForTestServer)(this._serializer, messageSink);
  }
  async _collectingInternalReporter(...extraReporters) {
    const report = [];
    const collectingReporter = await (0, import_reporters.createReporterForTestServer)(this._serializer, (e) => report.push(e));
    return { reporter: new import_internalReporter.InternalReporter([collectingReporter, ...extraReporters]), report };
  }
  async initialize(params) {
    this._serializer = params.serializer || require.resolve("./uiModeReporter");
    this._closeOnDisconnect = !!params.closeOnDisconnect;
    await this._setInterceptStdio(!!params.interceptStdio);
    this._watchTestDirs = !!params.watchTestDirs;
    this._populateDependenciesOnList = !!params.populateDependenciesOnList;
  }
  async ping() {
  }
  async open(params) {
    if ((0, import_utils.isUnderTest)())
      return;
    (0, import_utilsBundle.open)("vscode://file/" + params.location.file + ":" + params.location.line).catch((e) => console.error(e));
  }
  async resizeTerminal(params) {
    process.stdout.columns = params.cols;
    process.stdout.rows = params.rows;
    process.stderr.columns = params.cols;
    process.stderr.rows = params.rows;
  }
  async checkBrowsers() {
    return { hasBrowsers: hasSomeBrowsers() };
  }
  async installBrowsers() {
    await installBrowsers();
  }
  async runGlobalSetup(params) {
    await this.runGlobalTeardown();
    const { reporter, report } = await this._collectingInternalReporter(new import_list.default());
    const config = await this._loadConfigOrReportError(reporter, this._configCLIOverrides);
    if (!config)
      return { status: "failed", report };
    const { status, cleanup } = await (0, import_tasks.runTasksDeferCleanup)(new import_tasks.TestRun(config, reporter), [
      ...(0, import_tasks.createGlobalSetupTasks)(config)
    ]);
    if (status !== "passed")
      await cleanup();
    else
      this._globalSetup = { cleanup, report };
    return { report, status };
  }
  async runGlobalTeardown() {
    const globalSetup = this._globalSetup;
    const status = await globalSetup?.cleanup();
    this._globalSetup = void 0;
    return { status, report: globalSetup?.report || [] };
  }
  async startDevServer(params) {
    await this.stopDevServer({});
    const { reporter, report } = await this._collectingInternalReporter();
    const config = await this._loadConfigOrReportError(reporter);
    if (!config)
      return { report, status: "failed" };
    const { status, cleanup } = await (0, import_tasks.runTasksDeferCleanup)(new import_tasks.TestRun(config, reporter), [
      (0, import_tasks.createLoadTask)("out-of-process", { failOnLoadErrors: true, filterOnly: false }),
      (0, import_tasks.createStartDevServerTask)()
    ]);
    if (status !== "passed")
      await cleanup();
    else
      this._devServer = { cleanup, report };
    return { report, status };
  }
  async stopDevServer(params) {
    const devServer = this._devServer;
    const status = await devServer?.cleanup();
    this._devServer = void 0;
    return { status, report: devServer?.report || [] };
  }
  async clearCache(params) {
    const reporter = new import_internalReporter.InternalReporter([]);
    const config = await this._loadConfigOrReportError(reporter);
    if (!config)
      return;
    await (0, import_tasks.runTasks)(new import_tasks.TestRun(config, reporter), [
      (0, import_tasks.createClearCacheTask)(config)
    ]);
  }
  async listFiles(params) {
    const { reporter, report } = await this._collectingInternalReporter();
    const config = await this._loadConfigOrReportError(reporter);
    if (!config)
      return { status: "failed", report };
    config.cliProjectFilter = params.projects?.length ? params.projects : void 0;
    const status = await (0, import_tasks.runTasks)(new import_tasks.TestRun(config, reporter), [
      (0, import_tasks.createListFilesTask)(),
      (0, import_tasks.createReportBeginTask)()
    ]);
    return { report, status };
  }
  async listTests(params) {
    let result;
    this._queue = this._queue.then(async () => {
      const { config, report, status } = await this._innerListTests(params);
      if (config)
        await this._updateWatchedDirs(config);
      result = { report, status };
    }).catch(printInternalError);
    await this._queue;
    return result;
  }
  async _innerListTests(params) {
    const overrides = {
      ...this._configCLIOverrides,
      repeatEach: 1,
      retries: 0
    };
    const { reporter, report } = await this._collectingInternalReporter();
    const config = await this._loadConfigOrReportError(reporter, overrides);
    if (!config)
      return { report, reporter, status: "failed" };
    config.cliArgs = params.locations || [];
    config.cliGrep = params.grep;
    config.cliGrepInvert = params.grepInvert;
    config.cliProjectFilter = params.projects?.length ? params.projects : void 0;
    config.cliListOnly = true;
    const status = await (0, import_tasks.runTasks)(new import_tasks.TestRun(config, reporter), [
      (0, import_tasks.createLoadTask)("out-of-process", { failOnLoadErrors: false, filterOnly: false, populateDependencies: this._populateDependenciesOnList }),
      (0, import_tasks.createReportBeginTask)()
    ]);
    return { config, report, reporter, status };
  }
  async _updateWatchedDirs(config) {
    this._watchedProjectDirs = /* @__PURE__ */ new Set();
    this._ignoredProjectOutputs = /* @__PURE__ */ new Set();
    for (const p of config.projects) {
      this._watchedProjectDirs.add(p.project.testDir);
      this._ignoredProjectOutputs.add(p.project.outputDir);
    }
    const result = await resolveCtDirs(config);
    if (result) {
      this._watchedProjectDirs.add(result.templateDir);
      this._ignoredProjectOutputs.add(result.outDir);
    }
    if (this._watchTestDirs)
      await this._updateWatcher(false);
  }
  async _updateWatcher(reportPending) {
    await this._watcher.update([...this._watchedProjectDirs, ...this._watchedTestDependencies], [...this._ignoredProjectOutputs], reportPending);
  }
  async runTests(params) {
    let result = { status: "passed" };
    this._queue = this._queue.then(async () => {
      result = await this._innerRunTests(params).catch((e) => {
        printInternalError(e);
        return { status: "failed" };
      });
    });
    await this._queue;
    return result;
  }
  async _innerRunTests(params) {
    await this.stopTests();
    const overrides = {
      ...this._configCLIOverrides,
      repeatEach: 1,
      retries: 0,
      preserveOutputDir: true,
      reporter: params.reporters ? params.reporters.map((r) => [r]) : void 0,
      use: {
        ...this._configCLIOverrides.use,
        ...params.trace === "on" ? { trace: { mode: "on", sources: false, _live: true } } : {},
        ...params.trace === "off" ? { trace: "off" } : {},
        ...params.video === "on" || params.video === "off" ? { video: params.video } : {},
        ...params.headed !== void 0 ? { headless: !params.headed } : {},
        _optionContextReuseMode: params.reuseContext ? "when-possible" : void 0,
        _optionConnectOptions: params.connectWsEndpoint ? { wsEndpoint: params.connectWsEndpoint } : void 0
      },
      ...params.updateSnapshots ? { updateSnapshots: params.updateSnapshots } : {},
      ...params.updateSourceMethod ? { updateSourceMethod: params.updateSourceMethod } : {},
      ...params.workers ? { workers: params.workers } : {}
    };
    if (params.trace === "on")
      process.env.PW_LIVE_TRACE_STACKS = "1";
    else
      process.env.PW_LIVE_TRACE_STACKS = void 0;
    const wireReporter = await this._wireReporter((e) => this._dispatchEvent("report", e));
    const config = await this._loadConfigOrReportError(new import_internalReporter.InternalReporter([wireReporter]), overrides);
    if (!config)
      return { status: "failed" };
    const testIdSet = params.testIds ? new Set(params.testIds) : null;
    config.cliListOnly = false;
    config.cliPassWithNoTests = true;
    config.cliArgs = params.locations || [];
    config.cliGrep = params.grep;
    config.cliGrepInvert = params.grepInvert;
    config.cliProjectFilter = params.projects?.length ? params.projects : void 0;
    config.testIdMatcher = testIdSet ? (id) => testIdSet.has(id) : void 0;
    const configReporters = await (0, import_reporters.createReporters)(config, "test", true);
    const reporter = new import_internalReporter.InternalReporter([...configReporters, wireReporter]);
    const stop = new import_utils.ManualPromise();
    const tasks = [
      (0, import_tasks.createApplyRebaselinesTask)(),
      (0, import_tasks.createLoadTask)("out-of-process", { filterOnly: true, failOnLoadErrors: false, doNotRunDepsOutsideProjectFilter: true }),
      ...(0, import_tasks.createRunTestsTasks)(config)
    ];
    const run = (0, import_tasks.runTasks)(new import_tasks.TestRun(config, reporter), tasks, 0, stop).then(async (status) => {
      this._testRun = void 0;
      return status;
    });
    this._testRun = { run, stop };
    return { status: await run };
  }
  async watch(params) {
    this._watchedTestDependencies = /* @__PURE__ */ new Set();
    for (const fileName of params.fileNames) {
      this._watchedTestDependencies.add(fileName);
      (0, import_compilationCache.dependenciesForTestFile)(fileName).forEach((file) => this._watchedTestDependencies.add(file));
    }
    await this._updateWatcher(true);
  }
  async findRelatedTestFiles(params) {
    const errorReporter = (0, import_reporters.createErrorCollectingReporter)(import_base.internalScreen);
    const reporter = new import_internalReporter.InternalReporter([errorReporter]);
    const config = await this._loadConfigOrReportError(reporter);
    if (!config)
      return { errors: errorReporter.errors(), testFiles: [] };
    const status = await (0, import_tasks.runTasks)(new import_tasks.TestRun(config, reporter), [
      (0, import_tasks.createLoadTask)("out-of-process", { failOnLoadErrors: true, filterOnly: false, populateDependencies: true })
    ]);
    if (status !== "passed")
      return { errors: errorReporter.errors(), testFiles: [] };
    return { testFiles: (0, import_compilationCache.affectedTestFiles)(params.files) };
  }
  async stopTests() {
    this._testRun?.stop?.resolve();
    await this._testRun?.run;
  }
  async _setInterceptStdio(intercept) {
    if (process.env.PWTEST_DEBUG)
      return;
    if (intercept) {
      if (import_utilsBundle.debug.log === originalDebugLog) {
        import_utilsBundle.debug.log = (...args) => {
          const string = import_util.default.format(...args) + "\n";
          return originalStderrWrite.apply(process.stderr, [string]);
        };
      }
      process.stdout.write = (chunk) => {
        this._dispatchEvent("stdio", chunkToPayload("stdout", chunk));
        return true;
      };
      process.stderr.write = (chunk) => {
        this._dispatchEvent("stdio", chunkToPayload("stderr", chunk));
        return true;
      };
    } else {
      import_utilsBundle.debug.log = originalDebugLog;
      process.stdout.write = originalStdoutWrite;
      process.stderr.write = originalStderrWrite;
    }
  }
  async closeGracefully() {
    (0, import_utils.gracefullyProcessExitDoNotHang)(0);
  }
  async _loadConfig(overrides) {
    try {
      const config = await (0, import_configLoader.loadConfig)(this._configLocation, overrides);
      if (!this._plugins) {
        (0, import_webServerPlugin.webServerPluginsForConfig)(config).forEach((p) => config.plugins.push({ factory: p }));
        (0, import_gitCommitInfoPlugin.addGitCommitInfoPlugin)(config);
        this._plugins = config.plugins || [];
      } else {
        config.plugins.splice(0, config.plugins.length, ...this._plugins);
      }
      return { config };
    } catch (e) {
      return { config: null, error: (0, import_util2.serializeError)(e) };
    }
  }
  async _loadConfigOrReportError(reporter, overrides) {
    const { config, error } = await this._loadConfig(overrides);
    if (config)
      return config;
    reporter.onConfigure(import_teleReceiver.baseFullConfig);
    reporter.onError(error);
    await reporter.onEnd({ status: "failed" });
    await reporter.onExit();
    return null;
  }
}
async function runUIMode(configFile, configCLIOverrides, options) {
  const configLocation = (0, import_configLoader.resolveConfigLocation)(configFile);
  return await innerRunTestServer(configLocation, configCLIOverrides, options, async (server, cancelPromise) => {
    await (0, import_server.installRootRedirect)(server, [], { ...options, webApp: "uiMode.html" });
    if (options.host !== void 0 || options.port !== void 0) {
      await (0, import_server.openTraceInBrowser)(server.urlPrefix("human-readable"));
    } else {
      const channel = await installedChromiumChannelForUI(configLocation, configCLIOverrides);
      const page = await (0, import_server.openTraceViewerApp)(server.urlPrefix("precise"), "chromium", {
        headless: (0, import_utils.isUnderTest)() && process.env.PWTEST_HEADED_FOR_TEST !== "1",
        persistentContextOptions: {
          handleSIGINT: false,
          channel
        }
      });
      page.on("close", () => cancelPromise.resolve());
    }
  });
}
async function installedChromiumChannelForUI(configLocation, configCLIOverrides) {
  const config = await (0, import_configLoader.loadConfig)(configLocation, configCLIOverrides).catch((e) => null);
  if (!config)
    return void 0;
  if (config.projects.some((p) => (!p.project.use.browserName || p.project.use.browserName === "chromium") && !p.project.use.channel))
    return void 0;
  for (const channel of ["chromium", "chrome", "msedge"]) {
    if (config.projects.some((p) => p.project.use.channel === channel))
      return channel;
  }
  return void 0;
}
async function runTestServer(configFile, configCLIOverrides, options) {
  const configLocation = (0, import_configLoader.resolveConfigLocation)(configFile);
  return await innerRunTestServer(configLocation, configCLIOverrides, options, async (server) => {
    console.log("Listening on " + server.urlPrefix("precise").replace("http:", "ws:") + "/" + server.wsGuid());
  });
}
async function innerRunTestServer(configLocation, configCLIOverrides, options, openUI) {
  const testServer = new TestServer(configLocation, configCLIOverrides);
  const cancelPromise = new import_utils.ManualPromise();
  const sigintWatcher = new import_sigIntWatcher.SigIntWatcher();
  process.stdin.on("close", () => (0, import_utils.gracefullyProcessExitDoNotHang)(0));
  void sigintWatcher.promise().then(() => cancelPromise.resolve());
  try {
    const server = await testServer.start(options);
    await openUI(server, cancelPromise);
    await cancelPromise;
  } finally {
    await testServer.stop();
    sigintWatcher.disarm();
  }
  return sigintWatcher.hadSignal() ? "interrupted" : "passed";
}
function chunkToPayload(type, chunk) {
  if (chunk instanceof Uint8Array)
    return { type, buffer: chunk.toString("base64") };
  return { type, text: chunk };
}
function hasSomeBrowsers() {
  for (const browserName of ["chromium", "webkit", "firefox"]) {
    try {
      import_server.registry.findExecutable(browserName).executablePathOrDie("javascript");
      return true;
    } catch {
    }
  }
  return false;
}
async function installBrowsers() {
  const executables = import_server.registry.defaultExecutables();
  await import_server.registry.install(executables, false);
}
function printInternalError(e) {
  console.error("Internal error:", e);
}
async function resolveCtDirs(config) {
  const use = config.config.projects[0].use;
  const relativeTemplateDir = use.ctTemplateDir || "playwright";
  const templateDir = await import_fs.default.promises.realpath(import_path.default.normalize(import_path.default.join(config.configDir, relativeTemplateDir))).catch(() => void 0);
  if (!templateDir)
    return null;
  const outDir = use.ctCacheDir ? import_path.default.resolve(config.configDir, use.ctCacheDir) : import_path.default.resolve(templateDir, ".cache");
  return {
    outDir,
    templateDir
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TestServerDispatcher,
  resolveCtDirs,
  runTestServer,
  runUIMode
});
