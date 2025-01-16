import { AppState } from "./appstate";


export default class Minimap {
    element: HTMLElement;
    appState: AppState;
    cachedAppState: AppState | undefined;
    cellElements: HTMLElement[] = [];

    constructor(appState: AppState) {
        this.appState = appState;
        // copy the appState object into the cachedAppState object
        this.cachedAppState = JSON.parse(JSON.stringify(appState));
        this.element = document.createElement('div');
        this.element.classList.add('minimapui');
        let bankNum = 8;
        for (let i=0; i<8; i++) {
            let bank = document.createElement('div');
            bank.classList.add('bank');
            bank.style.backgroundColor = appState.bankColors[i][1];
            this.element.appendChild(bank);
            let bankHalves = 2;
            let cellNum = 64;
            
            for (let j=0; j<bankHalves; j++) {
                let bankHalf = document.createElement('div');
                bankHalf.classList.add('bankHalf');
                bank.appendChild(bankHalf);
                let offset = (i * 128) + (j * 64) + 1;
                for (let k=0; k<cellNum; k++) {
                    let cell = document.createElement('div');
                    cell.classList.add('cell');
                    this.cellElements.push(cell);

                    cell.textContent = (k + offset).toString();
                    cell.addEventListener('click', () => {
                        console.log('cell clicked', k + offset);
                    });
                    bankHalf.appendChild(cell);
                }
            }
        }
    }
    render() {
        // console.log('rendering grid');
        // console.log(this.appState.currentBank, this.cachedAppState?.currentBank)
        if (this.appState !== this.cachedAppState) {
            // console.log('rendering minimap', this.appState.currentBank);
            this.element.querySelectorAll('.bank').forEach((bank, i) => {
                if (i === this.appState.currentBank) {
                    bank.classList.add('currentBank');
                    bank.querySelectorAll('.bankHalf').forEach((bankHalf, j) => {
                        if (j === this.appState.currentBankHalf) {
                            bankHalf.classList.add('currentBankHalf');
                        } else {
                            bankHalf.classList.remove('currentBankHalf');
                        }
                    });
                } else {
                    bank.classList.remove('currentBank');
                }
            });
            this.cellElements.forEach((cell, i) => {
                if (i === this.appState.currentAbsoluteCell) {
                    cell.classList.add('highlight');
                } else {
                    cell.classList.remove('highlight');
                }
            })
            this.cachedAppState = JSON.parse(JSON.stringify(this.appState));
        }
    }
}