type CellCoords = { col: number, row: number };
export default class Launchpad {
    midiInput: MIDIInput;
    midiOutput: MIDIOutput;
    layers: any[];
    currentLayerIndex: number;

    constructor(midiInput: MIDIInput, midiOutput: MIDIOutput) {
        this.midiInput = midiInput;
        this.midiOutput = midiOutput;
        midiInput.addEventListener('midimessage', (event) => {
            this.handleMidiInput(event.data!);
        });
        this.layers = [];
        this.currentLayerIndex = 0;
    }

    setLayer(index: number) {
        this.currentLayerIndex = index;
        let newLayer = this.layers[index];
        if (newLayer) {
            //newLayer.wipe();
            newLayer.onChange();
        } 
    }

    createLayer(layerInit: (layer: LaunchPadLayer) => void) {
        let layer = new LaunchPadLayer(this);
        layerInit(layer);
        this.layers.push(layer);
    }

    getCell(col: number, row: number ) {
        return this.currentLayer().cellMatrix[row][col];
    }

    currentLayer() {
        return this.layers[this.currentLayerIndex];
    }

    handleMidiInput(data: Uint8Array) {
        let status = data[0];
        if ((status === 0x90 || status === 176) && data[2] > 0) {
            let note = data[1];
            let cellCoords: CellCoords = this.getCellFromNote(note);
            this.onCellClick(cellCoords);
        }
    }

    onCellClick(cellCoords: CellCoords) {
        let currentLayer = this.layers[this.currentLayerIndex];
        if (currentLayer) {
            currentLayer.onCellClick(cellCoords);
        }
    }

    getCellFromNote(note: number) {
        let row = 9 - Math.floor(note / 10);
        let col = note % 10 - 1;
        return { col: col, row: row };
    }

    paintCell(cell: LaunchpadCell, color: number, mode=0) {
        let channel = mode;
        let status = 0x90 + channel;
        let cellIndex = cell.note;
        this.midiOutput.send([status, cellIndex, color]);
    }

}

export class LaunchPadLayer {
    launchPad: Launchpad;

    cellGroups: LaunchPadCellGroup[];
    cellMatrix: LaunchpadCell[][];

    constructor(launchPad: Launchpad) {
        this.launchPad = launchPad;

        this.cellMatrix = [];
        this.cellGroups = [];
        for (let y=0; y<10; y++) {
            this.cellMatrix[y] = [];
            for (let x=0; x<10; x++) {
                let cell = new LaunchpadCell(this, x, y);
                this.cellMatrix[y][x] = cell;
            }
        }
    }

    createCellGroup(col: number, row: number, width: number, height: number) {
        let cells = [];
        for (let j=0; j<height; j++) {
            for (let i=0; i<width; i++) {
                cells.push(this.getCell(col + i, row + j));
            }
        }
        let cellGroup =  new LaunchPadCellGroup(this.launchPad, cells, col, row, width, height);
        this.cellGroups.push(cellGroup);
        return cellGroup;
    }

    // createCell(col: number, row: number) {
    //     let cell = this.launchPad.getCell(col, row);
    //     this.cells.push(cell);
    //     return cell;
    // }

    onChange() {
        this.wipe();
        // iterate over the cells and paint them if they have a color
        this.cellMatrix.forEach(row => row.forEach(cell => {
            if (cell.color !== undefined) {
                this.launchPad.paintCell(cell, cell.color, cell.mode);
            }
        }));
    }

    onCellClick(cellCoords: CellCoords) {
        console.log('cell clicked', cellCoords);
        // // find cellgroups that contain the cell
        let cellGroups = this.cellGroups.filter(cellGroup => {
            return cellCoords.col >= cellGroup.col && cellCoords.col < cellGroup.col + cellGroup.width &&
                cellCoords.row >= cellGroup.row && cellCoords.row < cellGroup.row + cellGroup.height;
        });
        // // execute the click callback for each cellgroup with the index of the cell in the group
        cellGroups.forEach(cellGroup => {
            let index = (cellCoords.col - cellGroup.col) + (cellCoords.row - cellGroup.row) * cellGroup.width;
            cellGroup.executeCallbacks('click', index);
        });
        // // execute the click callback
        let cell = this.getCell(cellCoords.col, cellCoords.row);
        cell.executeCallbacks('click');
    }

    getCell(col: number, row: number) {
        return this.cellMatrix[row][col];
    }

    wipe() {
        this.cellMatrix.forEach(row => row.forEach(cell => 
            this.launchPad.paintCell(cell, 0, 0)
        ));
    }
}

export class LaunchPadCellGroup {
    cells: LaunchpadCell[];
    parent: Launchpad;
    col: number;
    row: number;
    width: number;
    height: number;
    callbacks: { [event: string]: (cell: LaunchpadCell, index: number) => void } = {};

    constructor(launchPad: Launchpad, cells: LaunchpadCell[], col: number, row: number, width: number, height: number) {
        this.parent = launchPad;
        this.cells = cells;
        this.col = col;
        this.row = row;
        this.width = width;
        this.height = height;
    }

    addEventListener(event: string, callback: (cell: LaunchpadCell, index: number) => void) {
        this.callbacks[event] = callback;
    }

    executeCallbacks(event: string, index: number) {
        let cell = this.cells[index];
        if (this.callbacks[event]) {
            this.callbacks[event](cell, index);
        }
    }

    paint(color: number, mode=0) {
        this.cells.forEach(cell => cell.paint(color, mode));
    }

    cellAtIndex(index: number) {
        console.log(this.cells)
        return this.cells[index];
    }
}

class LaunchpadCell {
    callbacks: { [event: string]: ((cell: LaunchpadCell) => void)[] } = {};
    note: number;
    col: number;
    row: number;
    parent: LaunchPadLayer;
    color: number|undefined;
    mode: number|undefined;

    constructor(parent: LaunchPadLayer, col: number, row: number) {
        // console.log('creating cell', col, row);
        this.col = col;
        this.row = row;
        this.note = (col + 1) + ((9 - row) * 10);
        this.parent = parent;
    }

    addEventListener(event: string, callback: (cell: LaunchpadCell) => void) {
        // add an array of callbacks for the event if it doet not exist    
        if (!this.callbacks[event]) {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push(callback.bind(this));
    }

    executeCallbacks(event: string) {
        let cell = this;
        if (this.callbacks[event]) {
            // execute all callbacks for the event with the context of the cell
            for (let i=0; i<this.callbacks[event].length; i++) {
                this.callbacks[event][i].bind(cell)(cell);
            }
        }
    }

    paint(color: number, mode=0) {
        this.color = color;
        this.mode = mode;
        this.parent.launchPad.paintCell(this, color, mode);
    }
}