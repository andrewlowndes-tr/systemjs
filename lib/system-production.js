"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var common_js_1 = require("./common.js");
var systemjs_production_loader_js_1 = require("./systemjs-production-loader.js");
systemjs_production_loader_js_1.default.prototype.version = VERSION;
var System = new systemjs_production_loader_js_1.default();
if (common_js_1.isBrowser || common_js_1.isWorker) {
    common_js_1.global.SystemJS = System;
    if (!common_js_1.global.System) {
        common_js_1.global.System = System;
    }
    else {
        var register = common_js_1.global.System.register;
        common_js_1.global.System.register = function () {
            if (register)
                register.apply(this, arguments);
            System.register.apply(System, arguments);
        };
    }
}
if (typeof module !== 'undefined' && module.exports)
    module.exports = System;
