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
var protocolFormatter_exports = {};
__export(protocolFormatter_exports, {
  formatProtocolParam: () => formatProtocolParam,
  renderTitleForCall: () => renderTitleForCall
});
module.exports = __toCommonJS(protocolFormatter_exports);
var import_protocolMetainfo = require("./protocolMetainfo");
function formatProtocolParam(params, name) {
  if (!params)
    return "";
  if (name === "url") {
    try {
      const urlObject = new URL(params[name]);
      if (urlObject.protocol === "data:")
        return urlObject.protocol;
      if (urlObject.protocol === "about:")
        return params[name];
      return urlObject.pathname + urlObject.search;
    } catch (error) {
      return params[name];
    }
  }
  if (name === "timeNumber") {
    return new Date(params[name]).toString();
  }
  return deepParam(params, name);
}
function deepParam(params, name) {
  const tokens = name.split(".");
  let current = params;
  for (const token of tokens) {
    if (typeof current !== "object" || current === null)
      return "";
    current = current[token];
  }
  if (current === void 0)
    return "";
  return String(current);
}
function renderTitleForCall(metadata) {
  const titleFormat = metadata.title ?? import_protocolMetainfo.methodMetainfo.get(metadata.type + "." + metadata.method)?.title ?? metadata.method;
  return titleFormat.replace(/\{([^}]+)\}/g, (_, p1) => {
    return formatProtocolParam(metadata.params, p1);
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  formatProtocolParam,
  renderTitleForCall
});
