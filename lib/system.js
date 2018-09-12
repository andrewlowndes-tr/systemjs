"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var common_js_1 = require("./common.js");
var systemjs_loader_js_1 = require("./systemjs-loader.js");
systemjs_loader_js_1.default.prototype.version = VERSION;
var System = new systemjs_loader_js_1.default();
if (common_js_1.isBrowser || common_js_1.isWorker)
    common_js_1.global.SystemJS = common_js_1.global.System = System;
if (typeof module !== 'undefined' && module.exports)
    module.exports = System;
