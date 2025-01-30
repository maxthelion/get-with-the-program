export default class Launchpad {
    constructor(midiInput, midiOutput) {
        this.cells = [];
        this.cellsByNote = {};
        this.midiInput = midiInput;
        this.midiOutput = midiOutput;
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                let cell = new LaunchpadCell(i, j);
                this.cells.push(cell);
                this.cellsByNote[cell.note] = cell;
            }
        }
        // if (this.midiInput.onmidimessage !== undefined) {
        let oldMidiCallback = this.midiInput.onmidimessage;
        // }
        midiInput.onmidimessage = (event) => {
            this.handleMidiInput(event.data);
            oldMidiCallback(event);
        };
    }
    getCell(col, row) {
        return this.cells[col + row * 10];
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
}
class LaunchpadCell {
    constructor(col, row) {
        this.callbacks = {};
        this.note = col + (9 - row) * 10;
    }
    addEventListener(event, callback) {
        // add an array of callbacks for the event if it doet not exist    
        if (!this.callbacks[event]) {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push(callback);
    }
    executeCallbacks(event) {
        let cell = this;
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => callback());
        }
    }
}
