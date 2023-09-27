const { name, version } = require('../package.json');

class Logger {
    static log(...messages) {
        console.log(`[${name}@${version}] :: `, messages.join(' '));
    }
}

module.exports = Logger;