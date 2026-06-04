const fs = require('fs');

function createManifestStore(manifestPath) {
    let manifest = {};

    return {
        reset() {
            manifest = {};
        },
        set(key, value) {
            manifest[key] = value;
        },
        getAll() {
            return manifest;
        },
        write() {
            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        },
    };
}

module.exports = { createManifestStore };
