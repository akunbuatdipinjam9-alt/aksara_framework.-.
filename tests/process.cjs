'use strict';
const cp = require('node:child_process');
// Feed standalone programs through stdin: Windows limits command lines to 32 KB.
module.exports = {
  ...cp,
  spawnSync(executable, args, options = {}) {
    if (executable === process.execPath && args[0] === '-e') {
      return cp.spawnSync(executable, ['-', ...args.slice(2)], {...options, input: args[1]});
    }
    return cp.spawnSync(executable, args, options);
  }
};
