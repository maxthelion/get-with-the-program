export default class Launchpad {
    cells: LaunchpadCell[] = []; 
    cellsByNote: { [note: number]: LaunchpadCell } = {};
    midiInput: MIDIInput;
    midiOutput: MIDIOutput;

    constructor(midiInput: MIDIInput, midiOutput: MIDIOutput) {
        this.midiInput = midiInput;
        this.midiOutput = midiOutput;

        for (let i=0; i<10; i++) {
            for (let j=0; j<10; j++) {
                let cell = new LaunchpadCell(i, j);
                this.cells.push(cell);
                this.cellsByNote[cell.note] = cell;
            }
        }
        // if (this.midiInput.onmidimessage !== undefined) {
            let oldMidiCallback = this.midiInput.onmidimessage;
        // }
        midiInput.onmidimessage = (event) => {
            this.handleMidiInput(event.data!);
            oldMidiCallback(event);
        };
        
    }

    getCell(col: number, row: number ) {
        return this.cells[col + row * 10];
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
}

class LaunchpadCell {
    callbacks: { [event: string]: (() => void)[] } = {};
    note: number;
    
    constructor(col: number, row: number) {
      this.note = col + (9 - row) * 10;  
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