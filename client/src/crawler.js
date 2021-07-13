/**
 * Problems in docker setup.
 * Removed from dev-deps, install locally
 *
 * npm install -g npm-license-crawler
 */
const crawler = require('npm-license-crawler');
const fs = require('fs');

/**
 * Describes the options for dumping the licenses.
 */
const options = {
    start: ['.'],
    json: 'licenses.json',
    onlyDirectDependencies: true
};

const production = {
    ...options,
    production: true
};

const development = {
    ...options,
    development: true
};

let data = '';

/**
 * To the `README.md` the content with used packages and
 * their licenses will appended to the end of the default content.
 */
fs.readFile(
    'README.md',
    {
        encoding: 'utf8',
        flag: 'r'
    },
    async (_, copy) => {
        let heading = '### Used software';
        const index = copy.search(heading);

        if (index > 0) {
            data = copy.slice(0, index) + heading + '\n';
        } else {
            data = copy + '\n' + heading + '\n';
        }

        data += '\nOpenSlides uses the following software or parts of them:\n\n';
    }
);

/**
 * Dump the licenses
 */
crawler.dumpLicenses(production, async (_, res) => {
    writeToFile(res);

    await crawler.dumpLicenses(development, async (_, res) => {
        writeToFile(res);
        await fs.writeFile('README.md', data, 'utf8', async () => {
            // Here the previously created file will be deleted.
            await fs.unlink('licenses.json', () => {});
        });
    });
});

/**
 * Function to write down a list of all found packages in the `package.json`.
 *
 * @param {json} licenses are all found packages in the project.
 */
function writeToFile(licenses) {
    let resources = [];
    for (let key in licenses) {
        resources.push({
            name: key,
            repository: licenses[key]['repository'],
            license: licenses[key]['licenses']
        });
    }

    for (let entry of resources) {
        data += '- [' + entry.name + ']' + '(' + entry.repository + ')' + ', License: ' + entry.license + '\n';
    }
}
