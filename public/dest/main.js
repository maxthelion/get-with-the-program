import Grid from './grid.js';
import Launchpad from './launchpad.js';
import Minimap from './minimap.js';
var appState = {
    currentBank: 0,
    highlightedCell: 0,
    currentAbsoluteCell: 0,
    currentBankHalf: 0,
    backgroundColor: 0,
    bankColors: [
        [5, "red"],
        [13, "yellow"],
        [21, "limegreen"],
        [29, "teal"],
        [37, "cyan"],
        [45, "blue"],
        [53, "magenta"],
        [61, "orange"],
    ]
};
var midiInput;
var midiAccess;
var midiOutput;
var midiOutput2;
var launchPad;
var mainCellMatrix;
var controlledChannel = 0;
document.addEventListener('DOMContentLoaded', () => {
    let grid = new Grid(appState);
    let minimap = new Minimap(appState);
    setInterval(() => {
        grid.render();
        minimap.render();
    }, 1000 / 30);
    setUpMidi(() => {
        launchPad = new Launchpad(midiInput, midiOutput);
        launchPad.createLayer((layer) => {
            if (!layer) {
                throw new Error('layer not initialized');
            }
            console.log('launchpad initialized', layer);
            // let cell = launchPad.getCell(7, 0);
            // cell.addEventListener('click', (() => {
            //     console.log('randomize', cell);
            //     // let cellIndex = getRandomCellIndex();
            //     // console.log('random cell', cellIndex, cellIndexToMidiNote(cellIndex));
            //     // highlightCell(cellIndexToMidiNote(cellIndex));
            // }).bind(cell));
            // launchPad.paintCell(cell.col, cell.row, 37);
            let rightControls = layer.createCellGroup(8, 1, 1, 4);
            rightControls.paint(21);
            rightControls.addEventListener('click', () => {
                console.log('right controls clicked');
            });
            let topControls = layer.createCellGroup(0, 0, 4, 1);
            topControls.paint(21);
            // topControls.addEventListener('click', () => {
            //     console.log('top controls clicked');
            // });
            topControls.cells[0].addEventListener('click', () => { moveBank(-1); });
            topControls.cells[1].addEventListener('click', () => { moveBank(1); });
            topControls.cells[2].addEventListener('click', () => { shiftBankHalf(); });
            topControls.cells[3].addEventListener('click', () => { shiftBankHalf(); });
            mainCellMatrix = layer.createCellGroup(0, 1, 8, 8);
            mainCellMatrix.paint(29);
            mainCellMatrix.addEventListener('click', function (cell) {
                // console.log('main cell matrix clicked', this, cell);
                changeProgram(cell.note);
                repaint();
                cell.paint(37);
            });
            let channelSelectButton = layer.getCell(4, 0);
            channelSelectButton.paint(45);
            channelSelectButton.addEventListener('click', () => {
                console.log('channel select clicked');
                launchPad.setLayer(1);
            });
        });
        // channel select layer
        launchPad.createLayer((layer) => {
            if (!layer) {
                throw new Error('layer not initialized');
            }
            let channelCellMatrix = layer.createCellGroup(0, 1, 8, 2);
            channelCellMatrix.paint(45, 0);
            channelCellMatrix.cellAtIndex(controlledChannel).paint(5, 2);
            channelCellMatrix.addEventListener('click', function (cell, index) {
                console.log('channel cell matrix clicked', cell, index);
                controlledChannel = index;
                channelCellMatrix.paint(45, 0);
                console.log('controlled channel', controlledChannel);
                channelCellMatrix.cellAtIndex(controlledChannel).paint(5, 2);
                launchPad.setLayer(0);
            });
            let channelSelectButton = layer.getCell(4, 0);
            channelSelectButton.paint(45, 2);
            channelSelectButton.addEventListener('click', () => {
                console.log('channel select clicked');
                launchPad.setLayer(0);
            });
        });
        launchPad.setLayer(0);
    });
    document.getElementById('grid').appendChild(grid.element);
    document.getElementById('minimap').appendChild(minimap.element);
});
function repaint() {
    let color = appState.bankColors[appState.currentBank][0];
    let offset = (appState.currentBank * 128) + (appState.currentBankHalf * 64);
    let highlightColor = 3;
    mainCellMatrix.paint(color);
}
function getRandomCellIndex() {
    return Math.floor(Math.random() * 64) + 1;
}
function cellIndexToMidiNote(cellIndex) {
    let row = Math.floor(cellIndex / 9);
    let col = cellIndex % 10;
    return (10 - row) * 10 + col;
}
function gridIndexFromNote(midiNote) {
    let row = 8 - Math.floor(midiNote / 10);
    let col = midiNote % 10 - 1;
    return row * 8 + col;
}
function absoluteCellIndexFromGridIndex(gridIndex) {
    let offset = (appState.currentBank * 128) + (appState.currentBankHalf * 64);
    return offset + gridIndex;
}
function highlightCell(note) {
    appState.highlightedCell = note;
    appState.currentAbsoluteCell = absoluteCellIndexFromGridIndex(gridIndexFromNote(note));
    repaint();
}
function changeProgram(note) {
    let programNumber = gridIndexFromNote(note) + (appState.currentBankHalf * 64);
    let bank = appState.currentBank;
    console.log('change program', programNumber);
    let output = midiOutput2;
    // use MSB and LSB to set program
    // 0-63 is bank 0, 64-127 is bank 1
    const channel = 11; // MIDI Channel 1 (0-based)
    // Bank Select MSB (Control Change #0)
    output.send([0xB0 | channel, 0x00, bank]); // MSB = 2
    // Bank Select LSB (Control Change #32)
    output.send([0xB0 | channel, 0x20, bank]); // LSB = 3
    // Program Change
    output.send([0xC0 | channel, programNumber]); // Program = 5
}
function moveBank(delta) {
    appState.currentBank += delta;
    if (appState.currentBank < 0) {
        appState.currentBank = 7;
    }
    else if (appState.currentBank > 7) {
        appState.currentBank = 0;
    }
    repaint();
}
function shiftBankHalf() {
    appState.currentBankHalf = (appState.currentBankHalf == 1) ? 0 : 1;
    repaint();
    console.log('shift bank half', appState.currentBankHalf);
}
function setUpMidi(callback) {
    navigator.requestMIDIAccess().then((access) => {
        var _a;
        midiAccess = access;
        // list all the inputs
        for (let input of midiAccess.inputs.values()) {
            if (((_a = input.name) === null || _a === void 0 ? void 0 : _a.indexOf("Launchpad Mini")) > -1) {
                console.log('found input', input);
            }
        }
        for (let out of midiAccess.outputs.values()) {
            console.log("found output", out.name, out.id);
        }
        // macmini
        //Launchpad Mini MK3 LPMiniMK3 DAW In 289006756
        //Launchpad Mini MK3 LPMiniMK3 MIDI In 900833936
        // laptop
        // let inputId = "909199967"
        // macmini
        let controllerInputId = "-823483040";
        console.log('inputId', controllerInputId);
        // let inputId2 = "1823086654"
        let controllerOutputId = "900833936";
        let programChangeOutputId = "-314509236";
        midiOutput = midiAccess.outputs.get(controllerOutputId);
        midiOutput2 = midiAccess.outputs.get(programChangeOutputId);
        midiInput = midiAccess.inputs.get(controllerInputId);
        console.log('programChangeOut', midiOutput2);
        if (midiInput) {
            console.log('Connected to input', midiInput.name);
        }
        else {
            console.log(midiAccess.inputs, midiInput);
            console.log('No MIDI input devices present.');
        }
        if (midiOutput) {
        }
        else {
            console.log('No MIDI output devices present.', midiOutput);
        }
        callback();
    });
}
;
