const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

function readEnv(root) {
    const envPath = path.join(root, '.env');
    if (!fs.existsSync(envPath)) {
        return {};
    }

    const result = dotenv.parse(fs.readFileSync(envPath));
    return result || {};
}

module.exports = { readEnv };
