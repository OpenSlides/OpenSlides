import { Injectable } from '@angular/core';

import { IpcRenderer } from 'electron';
import { BehaviorSubject } from 'rxjs';

import { StorageService } from './storage.service';

const ELECTRON_NEW_SERVER_CHANNEL = 'newserver';
const LAST_SERVER_URL_STORE_KEY = 'lastUsedServer';

@Injectable({
    providedIn: 'root'
})
export class AttachExternalServerService {
    private _ipc: IpcRenderer | undefined = void 0;
    private usingElectron: boolean;
    private serverUrlSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');

    public serverUrlObservavle = this.serverUrlSubject.asObservable();

    public get isElectronApp(): boolean {
        return this.usingElectron;
    }

    public get extUrl(): string | null {
        if (this.usingElectron) {
            return this.serverUrlSubject.value;
        } else {
            return null;
        }
    }

    public constructor(private storageService: StorageService) {
        this.usingElectron = this.detectElectron();
        if (this.usingElectron) {
            this.registerIpc();
        }

        /**
         * Restore the last server we used, otherwise refresh would throw us out
         */
        storageService.get<string>(LAST_SERVER_URL_STORE_KEY).then(lastUrl => {
            if (lastUrl) {
                this.serverUrlSubject.next(lastUrl);
                this.announceNewServer(lastUrl);
            }
        });
    }

    public async setExtUrl(url: string): Promise<void> {
        const prettyUrl = this.prettifyUrl(url);
        this.serverUrlSubject.next(prettyUrl);
        if (prettyUrl.trim()) {
            await this.storageService.set(LAST_SERVER_URL_STORE_KEY, prettyUrl);
            this.announceNewServer(prettyUrl);
        }
    }

    private detectElectron(): boolean {
        /**
         * return true to debug in browser
         */
        // return true;
        try {
            if ((<any>window)?.require('electron')) {
                return true;
            }
        } catch (e) {
            return false;
        }
    }

    private registerIpc(): void {
        try {
            this._ipc = window.require('electron').ipcRenderer;
        } catch (e) {
            console.warn(e);
        }
    }

    private announceNewServer(url: string): void {
        if (!this._ipc) {
            return;
        }
        this._ipc.send(ELECTRON_NEW_SERVER_CHANNEL, url);
    }

    /**
     * Cut everything from an OpenSlies URL thats not useful or would harm the other services
     */
    private prettifyUrl(url: string): string {
        try {
            const urlObject = new URL(url);
            const prettyUrl = `${urlObject.protocol}//${urlObject.host}`;
            return prettyUrl;
        } catch (e) {
            return url;
        }
    }
}
