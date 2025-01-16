export default class Grid {
    element: HTMLElement;

    constructor() {
        this.element = document.createElement('div');
        this.element.classList.add('grid');
        for (let i=0; i<64; i++) {
            let cell = document.createElement('div');
            cell.classList.add('cell');
            cell.textContent = (i + 1).toString();
            cell.addEventListener('click', () => {
                console.log('cell clicked', i);
            }
            this.element.appendChild(cell);
        }
    }
}