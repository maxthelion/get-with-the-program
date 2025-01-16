import { AppState } from "./appstate";

export default class Grid {
    element: HTMLElement;
    appState: AppState;
    cachedAppState: AppState;

    constructor(appState: AppState) {
        this.appState = appState;
        // copy the appState object into the cachedAppState object
        this.cachedAppState = JSON.parse(JSON.stringify(appState));
        this.element = document.createElement('div');
        this.element.classList.add('grid');
        let offset = (appState.currentBank * 128) + (appState.currentBankHalf * 64);
        console.log('offset', offset);
        this.drawCells();
    }

    drawCells() {
        let offset = (this.appState.currentBank * 128) + (this.appState.currentBankHalf * 64);
        this.element.innerHTML = '';
        let color = this.appState.bankColors[this.appState.currentBank][1];
        for (let i=0; i<64; i++) {
            
            let cell = document.createElement('div');
            if (i === this.appState.currentAbsoluteCell - offset) {
                cell.classList.add('highlight');
            }
            cell.classList.add('cell');
            cell.style.backgroundColor = color;
            cell.textContent = (offset + i + 1).toString();
            cell.addEventListener('click', () => {
                console.log('cell clicked', i);
            })
            this.element.appendChild(cell);
        }
    }

    render() {
        // console.log('rendering grid');
        if (this.appState !== this.cachedAppState) {
            this.drawCells();
            this.cachedAppState = JSON.parse(JSON.stringify(this.appState));

        }
    }
}