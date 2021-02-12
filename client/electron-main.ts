import { app, protocol, BrowserWindow, Menu, session, shell, screen, ipcMain, globalShortcut } from 'electron';
import { BrowserWindowConstructorOptions, MenuItemConstructorOptions } from 'electron/main';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import * as url from 'url';

/**
 * cannot combine angular and electron modules, so this variable has to be copied
 */
const ELECTRON_NEW_SERVER_CHANNEL = 'newserver';
const args = process.argv.slice(1);
const debug = args.some(val => val === '--debug');

let win = null;
let osBackendUrl = '';

/**
 * Extract the openSlidesCsrfToken from a cookie, return it as string
 */
function extractToken(cookie: string): string {
    if (cookie) {
        /**
         * one might make this less ugly or find something smarter.
         * The shape is:
         * OpenSlidesCsrfToken=AAA; OpenSlidesSessionID=BBB
         */
        return cookie.split(';')[0].split('=')[1];
    }
}

/**
 * Configures the session for OpenSlides
 */
function configureSession(): void {
    const filter = { urls: ['http://*/*', 'https://*/*'] };

    /**
     * Remap the cookies SameSite directive from "Lax" to "None"
     * So electron will not simply throw them away
     */
    session.defaultSession.webRequest.onHeadersReceived(filter, (details, callback) => {
        const cookies = (details.responseHeaders['set-cookie'] || []).map(cookie =>
            cookie.replace('SameSite=Lax', 'SameSite=None')
        );

        if (cookies.length > 0) {
            details.responseHeaders['set-cookie'] = cookies;
        }
        callback({ cancel: false, responseHeaders: details.responseHeaders });
    });

    session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
        /**
         * after the login, the "requestHeaders" has a "Cookie" field "with capital C"
         * This contains somethin like:
         * OpenSlidesCsrfToken=AAA; OpenSlidesSessionID=BBB
         * using extractToken we extract the token value and set it as
         * `requestHeaders['x-csrftoken'] = xcsrftoken;`
         * It's ugly and it works
         */
        const xcsrftoken = extractToken(details.requestHeaders['Cookie']);
        details.requestHeaders['x-csrftoken'] = xcsrftoken;
        callback({ requestHeaders: details.requestHeaders });
    });
}

function createMenu(): void {
    const template: MenuItemConstructorOptions[] = [
        {
            label: 'File',
            submenu: [
                { role: 'reload' },
                { label: 'Logout', click: async () => cleanStorage() },
                { type: 'separator' },
                { role: 'quit' }
            ]
        },
        {
            label: 'View',
            submenu: [{ role: 'toggleDevTools' }, { role: 'togglefullscreen' }]
        },
        {
            role: 'help',
            submenu: [
                {
                    label: 'Report Issue',
                    click: async () => openExternal('https://github.com/OpenSlides/OpenSlides/issues/new/choose')
                },
                {
                    label: 'OpenSlides',
                    click: async () => openExternal('https://openslides.com/de')
                },
                {
                    label: 'Electron',
                    click: async () => openExternal('https://electronjs.org')
                }
            ]
        }
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function createWindow(): void {
    createMenu();

    /**
     * configure session for utter cookie madness
     */
    configureSession();

    const size = screen.getPrimaryDisplay().workAreaSize;
    const windowProperties: BrowserWindowConstructorOptions = {
        x: 0,
        y: 0,
        width: size.width,
        height: size.height,
        webPreferences: {
            /**
             * Third party script support
             */
            nodeIntegration: true,
            // nodeIntegrationInWorker: true,
            enableRemoteModule: true,
            webSecurity: !debug,
            allowRunningInsecureContent: debug
        }
    };

    win = new BrowserWindow(windowProperties);

    const urlFormat = url.format({
        pathname: 'index.html',
        protocol: 'file',
        slashes: true
    });

    win.loadURL(urlFormat);

    win.webContents.on('did-fail-load', () => {
        win.loadURL(urlFormat);
    });

    /**
     * Open links externally
     */
    win.webContents.on('new-window', (e, url) => {
        e.preventDefault();
        /**
         * If external links start with "file://"
         * replace them with the backendURL instead
         */
        if (url.startsWith('file://')) {
            url = url.substr(7);
            url = osBackendUrl + url;
        }
        shell.openExternal(url);
    });

    win.on('closed', () => {
        win = null;
    });
}

async function cleanStorage(): Promise<void> {
    await session.defaultSession.clearStorageData();
    console.log('Cleaned storage data');
    win.reload();
}

async function openExternal(link: string): Promise<void> {
    await shell.openExternal(link);
}

try {
    /**
     * On certificate error we disable default behaviour (stop loading the page)
     * and we then say "it is all fine - true" to the callback.
     * This is necessary to develop against self signed certificates
     */
    app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
        if (debug) {
            event.preventDefault();
            callback(true);
        }
    });

    /**
     * Intercept the file protocol, so we cann access the assets folder to
     * call css, js and json files.
     * In pure electron, this would not be required
     */
    app.on('ready', () => {
        /**
         * Add custom global shortcuts
         */
        globalShortcut.register('f12', () => {
            if (win) {
                win.toggleDevTools();
            }
        });

        protocol.interceptFileProtocol('file', (request, callback) => {
            /**
             * all urls start with 'file://'
             */
            const url = request.url.substr(7);
            callback({ path: path.normalize(`${__dirname}/dist/os3/${url}`) });
        });
        createWindow();
    });

    // on macOS, closing the window doesn't quit the app
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('activate', () => {
        if (win === null) {
            createWindow();
        }
    });

    /**
     * Get information from angulars "attach-external-server" service
     */
    ipcMain.on(ELECTRON_NEW_SERVER_CHANNEL, (_, arg: string) => {
        if (arg) {
            osBackendUrl = arg;
        }
    });
} catch (e) {
    console.error(e);
}
