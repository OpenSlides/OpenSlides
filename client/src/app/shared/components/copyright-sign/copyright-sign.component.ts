/**
 * Remember: Do not tell, Do not ask.
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

import { Subscription } from 'rxjs';

import { NotifyResponse, NotifyService } from 'app/core/core-services/notify.service';
import { OperatorService } from 'app/core/core-services/operator.service';
import { mediumDialogSettings } from 'app/shared/utils/dialog-settings';

/**
 * All player types.
 */
enum Player {
    noPlayer,
    thisPlayer,
    partner
}

/**
 * All states the game board can have.
 */
enum BoardStatus {
    Draw = 'draw',
    thisPlayer = 'thisPlayer',
    partner = 'partner',
    NotDecided = 'not decided'
}

/**
 * All states for the statemachine
 */
type State = 'start' | 'search' | 'waitForResponse' | 'myTurn' | 'foreignTurn';

/**
 * All events that can be handled by the statemachine.
 */
type StateEvent =
    | 'searchClicked'
    | 'recievedSearchRequest'
    | 'recievedSearchResponse'
    | 'recievedACK'
    | 'waitTimeout'
    | 'fieldClicked'
    | 'recievedTurn'
    | 'recievedRagequit';

/**
 * An action in one state.
 */
interface SMAction {
    handle: (data?: any) => State | null;
}

/**
 * The statemachine. Mapps events in states to actions.
 */
type StateMachine = { [state in State]?: { [event in StateEvent]?: SMAction } };

@Component({
    selector: 'os-c4dialog',
    template: `
        <h2 mat-dialog-title>{{ caption | translate }}</h2>
        <mat-dialog-content>
            <ng-container *ngIf="partnerName">
                <div class="space">
                    <div class="coin info-coin thisPlayer"></div>
                    <span>{{ getPlayerName() }}</span>
                </div>
                <div>
                    <div class="coin info-coin partner"></div>
                    <span>{{ partnerName }}</span>
                </div>
            </ng-container>
            <table [class]="disableBoard ? 'disabled' : ''" id="c4">
                <tr *ngFor="let row of [5, 4, 3, 2, 1, 0]">
                    <td *ngFor="let col of [0, 1, 2, 3, 4, 5, 6]">
                        <div [class]="getCoinClass(row, col)" (click)="clickField(row, col)"></div>
                    </td>
                </tr>
            </table>

            <div class="center">
                <button
                    (click)="handleEvent('searchClicked')"
                    *ngIf="state === 'start'"
                    mat-raised-button
                    color="accent"
                >
                    {{ 'Search player' | translate }}
                </button>
            </div>
        </mat-dialog-content>
        <mat-dialog-actions>
            <button mat-button mat-dialog-close>{{ 'Close' | translate }}</button>
        </mat-dialog-actions>
    `,
    styles: [
        `
            span {
                font-size: 20px;
                padding-left: 10px;
            }
            .center {
                text-align: center;
            }
            .space {
                margin-bottom: 5px;
            }
            #c4 {
                background-color: yellow;
                padding: 10px;
                margin: 15px auto;
            }
            #c4.disabled {
                background-color: grey;
            }
            #c4 td {
                width: 50px;
                height: 50px;
            }
            #c4 .notSelected {
                cursor: pointer;
                background-color: white;
            }
            #c4.disabled .notSelected {
                cursor: auto;
            }
            .thisPlayer {
                background-color: blue;
            }
            #c4.disabled .thisPlayer {
                background-color: #8888ff;
            }
            .partner {
                background-color: red;
            }
            #c4.disabled .partner {
                background-color: #ff8888;
            }
            .coin {
                border-radius: 50%;
                width: 100%;
                height: 100%;
            }
            .coin.info-coin {
                display: inline-block;
                width: 20px;
                height: 20px;
            }
        `
    ]
})
export class C4DialogComponent implements OnInit, OnDestroy {
    /**
     * The dialogs caption
     */
    public caption: string;

    /**
     * Saves, if the board is disabled.
     */
    public disableBoard: boolean;

    /**
     * The board. First columns, then rows. Size is 7x6.
     */
    public board: Player[][];

    /**
     * The channel of the partner.
     */
    private replyChannel: string;

    /**
     * The partners name.
     */
    public partnerName: string;

    /**
     * A timeout to go from waiting to search state.
     */
    private waitTimout: number | null;

    /**
     * A list of all subscriptions, so they can b unsubscribed on desroy.
     */
    private subscriptions: Subscription[] = [];

    /**
     * The current state of the state machine.
     */
    public state: State;

    /**
     * This is the state machine for this game :)
     */
    public SM: StateMachine = {
        start: {
            searchClicked: {
                handle: () => {
                    this.disableBoard = false;
                    this.resetBoard();
                    return 'search';
                }
            }
        },
        search: {
            recievedSearchRequest: {
                handle: (notify: NotifyResponse<{ name: string }>) => {
                    this.replyChannel = notify.sender_channel_id;
                    this.partnerName = notify.message.name;
                    return 'waitForResponse';
                }
            },
            recievedSearchResponse: {
                handle: (notify: NotifyResponse<{ name: string }>) => {
                    this.replyChannel = notify.sender_channel_id;
                    this.partnerName = notify.message.name;
                    // who starts?
                    const startPlayer = Math.random() < 0.5 ? Player.thisPlayer : Player.partner;
                    const startPartner: boolean = startPlayer === Player.partner;
                    // send ACK
                    this.notifyService.sendToChannels('c4_ACK', startPartner, this.replyChannel);
                    return startPlayer === Player.thisPlayer ? 'myTurn' : 'foreignTurn';
                }
            }
        },
        waitForResponse: {
            recievedACK: {
                handle: (notify: NotifyResponse<{}>) => {
                    if (notify.sender_channel_id !== this.replyChannel) {
                        return null;
                    }
                    return notify.message ? 'myTurn' : 'foreignTurn';
                }
            },
            waitTimeout: {
                handle: () => 'search'
            },
            recievedRagequit: {
                handle: (notify: NotifyResponse<{}>) => {
                    return notify.sender_channel_id === this.replyChannel ? 'search' : null;
                }
            }
        },
        myTurn: {
            fieldClicked: {
                handle: (data: { col: number; row: number }) => {
                    if (this.colFree(data.col)) {
                        this.setCoin(data.col, Player.thisPlayer);
                        this.notifyService.sendToChannels('c4_turn', { col: data.col }, this.replyChannel);
                        const nextState = this.getStateFromBoardStatus();
                        return nextState === null ? 'foreignTurn' : nextState;
                    } else {
                        return null;
                    }
                }
            },
            recievedRagequit: {
                handle: () => {
                    this.caption = "Your partner couldn't stand it anymore... You are the winner!";
                    return 'start';
                }
            }
        },
        foreignTurn: {
            recievedTurn: {
                handle: (notify: NotifyResponse<{ col: number }>) => {
                    if (notify.sender_channel_id !== this.replyChannel) {
                        return null;
                    }
                    const col: number = notify.message.col;
                    if (!this.colFree(col)) {
                        return null;
                    }
                    this.setCoin(col, Player.partner);
                    const nextState = this.getStateFromBoardStatus();
                    return nextState === null ? 'myTurn' : nextState;
                }
            },
            recievedRagequit: {
                handle: () => {
                    this.caption = "Your partner couldn't stand it anymore... You are the winner!";
                    return 'start';
                }
            }
        }
    };

    public constructor(
        public dialogRef: MatDialogRef<C4DialogComponent>,
        private notifyService: NotifyService,
        private op: OperatorService
    ) {
        this.resetBoard();
    }

    public ngOnInit(): void {
        // Setup initial values.
        this.state = 'start';
        this.caption = 'Connect 4';
        this.disableBoard = true;

        // Setup all subscription for needed notify messages
        this.subscriptions = [
            this.notifyService.getMessageObservable('c4_ACK').subscribe(notify => {
                if (!notify.sendByThisUser) {
                    this.handleEvent('recievedACK', notify);
                }
            }),
            this.notifyService.getMessageObservable('c4_ragequit').subscribe(notify => {
                if (!notify.sendByThisUser) {
                    this.handleEvent('recievedRagequit', notify);
                }
            }),
            this.notifyService.getMessageObservable('c4_search_request').subscribe(notify => {
                if (!notify.sendByThisUser) {
                    this.handleEvent('recievedSearchRequest', notify);
                }
            }),
            this.notifyService.getMessageObservable('c4_search_response').subscribe(notify => {
                if (!notify.sendByThisUser) {
                    this.handleEvent('recievedSearchResponse', notify);
                }
            }),
            this.notifyService.getMessageObservable('c4_turn').subscribe(notify => {
                if (!notify.sendByThisUser) {
                    this.handleEvent('recievedTurn', notify);
                }
            })
        ];
    }

    public ngOnDestroy(): void {
        // send ragequit and unsubscribe all subscriptions.
        if (this.replyChannel) {
            this.notifyService.sendToChannels('c4_ragequit', null, this.replyChannel);
        }
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
    }

    /**
     * Resets the board.
     */
    private resetBoard(): void {
        this.board = [];
        for (let i = 0; i < 7; i++) {
            const row = [];
            for (let j = 0; j < 6; j++) {
                row.push(Player.noPlayer);
            }
            this.board.push(row);
        }
    }

    /**
     * Returns the class needed in the board.
     * @param row The row
     * @param col The column
     */
    public getCoinClass(row: number, col: number): string {
        switch (this.board[col][row]) {
            case Player.noPlayer:
                return 'coin notSelected';
            case Player.thisPlayer:
                return 'coin thisPlayer';
            case Player.partner:
                return 'coin partner';
        }
    }

    /**
     * Returns the operators name.
     */
    public getPlayerName(): string {
        return this.op.viewUser.short_name;
    }

    /**
     * Returns null, if the game is not finished.
     */
    private getStateFromBoardStatus(): State {
        switch (this.boardStatus()) {
            case BoardStatus.Draw:
                this.caption = 'Game draw!';
                return 'start';
            case BoardStatus.thisPlayer:
                this.caption = 'You won!';
                return 'start';
            case BoardStatus.partner:
                this.caption = 'Your partner has won!';
                return 'start';
            case BoardStatus.NotDecided:
                return null;
        }
    }

    /**
     * Main state machine handler. The current state handler will be called with
     * the given event. If the handler returns a state (and not null), this will be
     * the next state. The state enter method will be called.
     * @param e The event for the statemachine.
     * @param data Additional data for the handler.
     */
    public handleEvent(e: StateEvent, data?: any): void {
        let action: SMAction = null;
        if (this.SM[this.state] && this.SM[this.state][e]) {
            action = this.SM[this.state][e];
            const nextState = action.handle(data);
            if (nextState !== null) {
                this.state = nextState;
                if (this['enter_' + nextState]) {
                    this['enter_' + nextState]();
                }
            }
        }
    }

    /**
     * Handler for clicks on the field.
     * @param row the row clicked
     * @param col the col clicked
     */
    public clickField(row: number, col: number): void {
        if (!this.disableBoard) {
            this.handleEvent('fieldClicked', { row: row, col: col });
        }
    }

    // Enter state methods
    /**
     * Resets all attributes of the state machine.
     */
    public enter_start(): void {
        this.disableBoard = true;
        this.replyChannel = null;
        this.partnerName = null;
    }

    /**
     * Sends a search request for other players.
     */
    public enter_search(): void {
        this.caption = 'Searching for players...';
        this.notifyService.sendToAllUsers('c4_search_request', { name: this.getPlayerName() });
    }

    /**
     * Sends a search response for a previous request.
     * Also sets up a timeout to go back into the search state.
     */
    public enter_waitForResponse(): void {
        this.caption = 'Wait for response...';
        this.notifyService.sendToChannels('c4_search_response', { name: this.getPlayerName() }, this.replyChannel);
        if (this.waitTimout) {
            clearTimeout(<any>this.waitTimout);
        }
        this.waitTimout = <any>setTimeout(() => {
            this.handleEvent('waitTimeout');
        }, 5000);
    }

    /**
     * Sets the caption.
     */
    public enter_myTurn(): void {
        this.caption = "It's your turn!";
    }

    /**
     * Sets the caption.
     */
    public enter_foreignTurn(): void {
        this.caption = "It's your partners turn";
    }

    // Board function
    /**
     * Places a coin on the board
     * @param col The col to place a coin
     * @param player The player who placed the coin
     */
    private setCoin(col: number, player: Player): void {
        for (let row = 0; row < 6; row++) {
            if (this.board[col][row] === Player.noPlayer) {
                this.board[col][row] = player;
                break;
            }
        }
    }

    /**
     * Returns true, if the given col is free to place a coin there
     * @param col the col
     */
    private colFree(col: number): boolean {
        return this.board[col][5] === Player.noPlayer;
    }

    /**
     * Returns the current state of the board
     */
    private boardStatus(): BoardStatus {
        // check if a player has won
        // vertical
        let won: Player;
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 4; col++) {
                won = this.board[col][row];
                for (let i = 1; i < 4 && won !== Player.noPlayer; i++) {
                    if (this.board[col + i][row] !== won) {
                        won = Player.noPlayer;
                    }
                }
                if (won !== Player.noPlayer) {
                    return won === Player.thisPlayer ? BoardStatus.thisPlayer : BoardStatus.partner;
                }
            }
        }
        // horizontal
        for (let col = 0; col < 7; col++) {
            for (let row = 0; row < 3; row++) {
                won = this.board[col][row];
                for (let i = 1; i < 4 && won !== Player.noPlayer; i++) {
                    if (this.board[col][row + i] !== won) {
                        won = Player.noPlayer;
                    }
                }
                if (won !== Player.noPlayer) {
                    return won === Player.thisPlayer ? BoardStatus.thisPlayer : BoardStatus.partner;
                }
            }
        }
        // diag 1
        for (let col = 0; col < 4; col++) {
            for (let row = 0; row < 3; row++) {
                won = this.board[col][row];
                for (let i = 1; i < 4 && won !== Player.noPlayer; i++) {
                    if (this.board[col + i][row + i] !== won) {
                        won = Player.noPlayer;
                    }
                }
                if (won !== Player.noPlayer) {
                    return won === Player.thisPlayer ? BoardStatus.thisPlayer : BoardStatus.partner;
                }
            }
        }
        // diag 1
        for (let col = 3; col < 7; col++) {
            for (let row = 0; row < 3; row++) {
                won = this.board[col][row];
                for (let i = 1; i < 4 && won !== Player.noPlayer; i++) {
                    if (this.board[col - i][row + i] !== won) {
                        won = Player.noPlayer;
                    }
                }
                if (won !== Player.noPlayer) {
                    return won === Player.thisPlayer ? BoardStatus.thisPlayer : BoardStatus.partner;
                }
            }
        }
        // game draw?
        let draw = true;
        for (let col = 0; col < 7; col++) {
            if (this.board[col][5] === Player.noPlayer) {
                draw = false;
                break;
            }
        }
        return draw ? BoardStatus.Draw : BoardStatus.NotDecided;
    }
}

@Component({
    selector: 'os-copyright-sign',
    template: ` <span (click)="launchC4($event)">©</span> `,
    styles: [``]
})
export class CopyrightSignComponent {
    private clickTimeout: number | null;
    private clickCounter = 0;

    public constructor(private dialog: MatDialog, private op: OperatorService) {}

    public launchC4(event: Event): void {
        event.stopPropagation();
        event.preventDefault();

        // no anonymous invited..
        if (!this.op.user) {
            return;
        }

        this.clickCounter++;
        if (this.clickTimeout) {
            clearTimeout(<any>this.clickTimeout);
        }

        if (this.clickCounter === 5) {
            this.clickCounter = 0;
            this.dialog.open(C4DialogComponent, mediumDialogSettings);
        } else {
            this.clickTimeout = <any>setTimeout(() => {
                this.clickCounter = 0;
            }, 200);
        }
    }
}
