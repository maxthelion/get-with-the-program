export default class Launchpad {
    constructor(midiInput, midiOutput) {
        this.cells = [];
        this.cellsByNote = {};
        this.cellMatrix = [];
        this.midiInput = midiInput;
        this.midiOutput = midiOutput;
        for (let y = 0; y < 10; y++) {
            this.cellMatrix[y] = [];
            for (let x = 0; x < 10; x++) {
                let cell = new LaunchpadCell(this, x, y);
                this.cellMatrix[y][x] = cell;
                this.cells.push(cell);
                this.cellsByNote[cell.note] = cell;
            }
        }
        this.wipe();
        midiInput.addEventListener('midimessage', (event) => {
            this.handleMidiInput(event.data);
        });
        // console.log(this.cellMatrix);
    }
    wipe() {
        this.cells.forEach(cell => this.paintCell(cell.col, cell.row, 0));
    }
    getCell(col, row) {
        return this.cellMatrix[row][col];
    }
    handleMidiInput(data) {
        let status = data[0];
        if (status === 0x90 && data[2] > 0) {
            let note = data[1];
            //highlightCell(note);
            let cell = this.getCellFromNote(note);
            cell.executeCallbacks('click');
        }
        else if (status === 176 && data[2] > 0) {
            let note = data[1];
            //handleCCinput(data);
            let cell = this.getCellFromNote(note);
            cell.executeCallbacks('click');
        }
    }
    getCellFromNote(note) {
        return this.cellsByNote[note];
    }
    gridIndexFromNote(midiNote) {
        let row = 8 - Math.floor(midiNote / 10);
        let col = midiNote % 10 - 1;
        return row * 8 + col;
    }
    paintCell(col, row, color) {
        let cell = this.getCell(col, row);
        let channel = 0;
        let status = 0x90 + channel;
        let cellIndex = cell.note;
        this.midiOutput.send([status, cellIndex, color]);
    }
    getCellGroup(col, row, width, height) {
        let cells = [];
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
                // console.log("adding cell", col + i, row + j);
                cells.push(this.getCell(col + i, row + j));
            }
        }
        return new LaunchPadCellGroup(this, cells);
    }
}
export class LaunchPadCellGroup {
    constructor(launchPad, cells) {
        this.parent = launchPad;
        this.cells = cells;
    }
    addEventListener(event, callback) {
        this.cells.forEach(cell => cell.addEventListener(event, callback));
    }
    paint(color) {
        this.cells.forEach(cell => this.parent.paintCell(cell.col, cell.row, color));
    }
}
class LaunchpadCell {
    constructor(parent, col, row) {
        this.callbacks = {};
        // console.log('creating cell', col, row);
        this.col = col;
        this.row = row;
        this.note = (col + 1) + ((9 - row) * 10);
        this.parent = parent;
    }
    addEventListener(event, callback) {
        // add an array of callbacks for the event if it doet not exist    
        if (!this.callbacks[event]) {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push(callback.bind(this));
    }
    executeCallbacks(event) {
        let cell = this;
        if (this.callbacks[event]) {
            // execute all callbacks for the event with the context of the cell
            for (let i = 0; i < this.callbacks[event].length; i++) {
                this.callbacks[event][i].bind(cell)(cell);
            }
        }
    }
    paint(color) {
        this.parent.paintCell(this.col, this.row, color);
    }
}
