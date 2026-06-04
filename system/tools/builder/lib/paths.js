const fs = require('fs');
const path = require('path');

function ensureDirectory(directoryPath) {
    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
    }
}

function emptyDirectory(directoryPath) {
    ensureDirectory(directoryPath);

    for (const entry of fs.readdirSync(directoryPath, { withFileTypes: true })) {
        const target = path.join(directoryPath, entry.name);

        if (entry.name === '.gitkeep') {
            continue;
        }

        if (entry.isDirectory()) {
            emptyDirectory(target);
            continue;
        }

        fs.unlinkSync(target);
    }
}

function copyDirectory(source, destination) {
    if (!fs.existsSync(source)) {
        return;
    }

    ensureDirectory(destination);

    for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
        const sourcePath = path.join(source, entry.name);
        const destinationPath = path.join(destination, entry.name);

        if (entry.isDirectory()) {
            copyDirectory(sourcePath, destinationPath);
            continue;
        }

        fs.copyFileSync(sourcePath, destinationPath);
    }
}

module.exports = {
    copyDirectory,
    emptyDirectory,
    ensureDirectory,
};
