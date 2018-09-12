import * as common from './common';
import * as config from './config';
import * as evaluate  from './evaluate';
import * as fetch  from './fetch';
import * as formatHelpers  from './format-helpers';
import * as instantiate  from './instantiate';
import * as resolve  from './resolve';
import * as systemProduction  from './system-production';
import * as system  from './system';
import * as systemjsLoader  from './systemjs-loader';
import * as systemjsProductionLoader  from './systemjs-production-loader';

export default {
    common,
    config,
    evaluate,
    fetch,
    'format-helpers': formatHelpers,
    instantiate,
    resolve,
    'system-production': systemProduction,
    system: system,
    'systemjs-loader': systemjsLoader,
    'systemjs-production-loader': systemjsProductionLoader
}
