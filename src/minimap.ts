export default class Minimap {
    element: HTMLElement;

    constructor() {
        this.element = document.createElement('div');
        this.element.classList.add('minimapui');
        let bankNum = 8;
        for (let i=0; i<8; i++) {
            let bank = document.createElement('div');
            bank.classList.add('bank');
            this.element.appendChild(bank);
            let bankHalves = 2;
            let cellNum = 64;
            for (let j=0; j<bankHalves; j++) {
                let bankHalf = document.createElement('div');
                bankHalf.classList.add('bankHalf');
                bank.appendChild(bankHalf);
                for (let k=0; k<cellNum; k++) {
                    let cell = document.createElement('div');
                    cell.classList.add('cell');
                    cell.textContent = (k + 1).toString();
                    cell.addEventListener('click', () => {
                        console.log('cell clicked', k);
                    });
                    bankHalf.appendChild(cell);
                }
            }
        }
    }
}