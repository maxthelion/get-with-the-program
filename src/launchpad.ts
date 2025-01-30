export default class Launchpad {
    cells: LaunchpadCell[] = []; 
    cellsByNote: { [note: number]: LaunchpadCell } = {};
    cellMatrix: LaunchpadCell[][] = [];
    midiInput: MIDIInput;
    midiOutput: MIDIOutput;

    constructor(midiInput: MIDIInput, midiOutput: MIDIOutput) {
        this.midiInput = midiInput;
        this.midiOutput = midiOutput;
        for (let y=0; y<10; y++) {
            this.cellMatrix[y] = [];
            for (let x=0; x<10; x++) {
                let cell = new LaunchpadCell(x, y);
                this.cellMatrix[y][x] = cell;
                this.cells.push(cell);
                this.cellsByNote[cell.note] = cell;
            }
        }
        this.wipe();
        // if (this.midiInput.onmidimessage !== undefined) {
            let oldMidiCallback = this.midiInput.onmidimessage;
        // }
        midiInput.onmidimessage = (event) => {
            this.handleMidiInput(event.data!);
            oldMidiCallback(event);
        };
        console.log(this.cellMatrix);
    }

    wipe() {
        this.cells.forEach(cell => this.paintCell(cell.col, cell.row, 0));
    }

    getCell(col: number, row: number ) {
        return this.cellMatrix[row][col];
    }

    handleMidiInput(data: Uint8Array) {
        let status = data[0];
        if (status === 0x90 && data[2] > 0) {
            let note = data[1];
            //highlightCell(note);
            let cell = this.getCellFromNote(note);
            cell.executeCallbacks('click');
        } else if (status === 176 && data[2] > 0) {
            let note = data[1];
            //handleCCinput(data);
            let cell = this.getCellFromNote(note);
            cell.executeCallbacks('click');
        }
    }

    getCellFromNote(note: number) {
        return this.cellsByNote[note];
    }

    gridIndexFromNote(midiNote: number) {
        let row = 8 - Math.floor(midiNote / 10);
        let col = midiNote % 10 - 1;
        return row * 8 + col;
    }

    paintCell(col: number, row: number, color: number) {
        let cell = this.getCell(col, row);
        let channel = 0;
        let status = 0x90 + channel;
        let cellIndex = cell.note;
        this.midiOutput.send([status, cellIndex, color]);
    }

    getCellGroup(col: number, row: number, width: number, height: number) {
        let cells = [];
        for (let i=0; i<width; i++) {
            for (let j=0; j<height; j++) {
                console.log("adding cell", col + i, row + j);
                cells.push(this.getCell(col + i, row + j));
            }
        }
        return new LaunchPadCellGroup(this, cells);
    }
}

export class LaunchPadCellGroup {
    cells: LaunchpadCell[];
    parent: Launchpad;

    constructor(launchPad: Launchpad, cells: LaunchpadCell[]) {
        this.parent = launchPad;
        this.cells = cells;
    }

    addEventListener(event: string, callback: () => void) {
        this.cells.forEach(cell => cell.addEventListener(event, callback));
    }

    paint(color: number) {
        this.cells.forEach(cell => this.parent.paintCell(cell.col, cell.row, color));
    }
}

class LaunchpadCell {
    callbacks: { [event: string]: (() => void)[] } = {};
    note: number;
    col: number;
    row: number;
    
    constructor(col: number, row: number) {
        // console.log('creating cell', col, row);
        this.col = col;
        this.row = row;
        this.note = (col + 1) + ((9 - row) * 10);
    }

    addEventListener(event: string, callback: () => void) {
        // add an array of callbacks for the event if it doet not exist    
        if (!this.callbacks[event]) {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push(callback);
    }

    executeCallbacks(event: string) {
        let cell = this;
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => callback());
        }
    }
}