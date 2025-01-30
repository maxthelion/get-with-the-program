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
document.addEventListener('DOMContentLoaded', () => {
    let grid = new Grid(appState);
    let minimap = new Minimap(appState);
    setInterval(() => {
        grid.render();
        minimap.render();
    }, 1000 / 30);
    setUpMidi(() => {
        launchPad = new Launchpad(midiInput, midiOutput);
        launchPad.cells.forEach((cell) => {
            cell.addEventListener('click', () => {
                console.log('cell clicked', cell.note);
            });
        });
        let cell = launchPad.getCell(0, 7);
        console.log('cell', cell);
        cell.addEventListener('click', (() => {
            console.log('randomize', cell);
            let cellIndex = getRandomCellIndex();
            console.log('random cell', cellIndex, cellIndexToMidiNote(cellIndex));
            highlightCell(cellIndexToMidiNote(cellIndex));
        }).bind(cell));
    });
    document.getElementById('grid').appendChild(grid.element);
    document.getElementById('minimap').appendChild(minimap.element);
});
function repaint() {
    let color = appState.bankColors[appState.currentBank][0];
    let offset = (appState.currentBank * 128) + (appState.currentBankHalf * 64);
    let highlightColor = 3;
    for (let i = 0; i < 64; i++) {
        let channel = 0;
        let status = 0x90 + channel;
        let row = Math.floor(i / 8) + 1;
        let col = i % 8 + 1;
        let cellIndex = row * 10 + col;
        let absolute = absoluteCellIndexFromGridIndex(gridIndexFromNote(cellIndex));
        if (absolute === appState.currentAbsoluteCell) {
            midiOutput.send([status, cellIndex, highlightColor]);
        }
        else {
            midiOutput.send([status, cellIndex, color]);
        }
    }
}
function getRandomCellIndex() {
    return Math.floor(Math.random() * 64) + 1;
}
function cellIndexToMidiNote(cellIndex) {
    let row = Math.floor(cellIndex / 10);
    let col = cellIndex % 10;
    return (8 - row) * 10 + col;
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
function handleMidiInput(data) {
    // console.log(data);
    let status = data[0];
    if (status === 0x90 && data[2] > 0) {
        let note = data[1];
        let velocity = data[2];
        let color = Math.floor(Math.random() * 127);
        //console.log('Note on', note, velocity);
        highlightCell(note);
        // changeProgram(note);
    }
    else if (status === 176) {
        handleCCinput(data);
    }
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
function handleCCinput(data) {
    if (data[2] === 127) {
        let channel = 0;
        let status = 0x90 + channel;
        let data1 = data[1];
        switch (data1) {
            case 91:
                moveBank(-1);
                break;
            case 92:
                moveBank(1);
                break;
            case 93:
                shiftBankHalf();
                break;
            case 94:
                shiftBankHalf();
                break;
        }
        let color = 5;
        midiOutput.send([status, data1, color]);
    }
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
            console.log("found output", out);
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
        let programChangeOutputId = "1434885207";
        midiOutput = midiAccess.outputs.get(controllerOutputId);
        midiOutput2 = midiAccess.outputs.get(programChangeOutputId);
        midiInput = midiAccess.inputs.get(controllerInputId);
        console.log('programChangeOut', midiOutput2);
        if (midiInput) {
            console.log('Connected to input', midiInput.name);
            midiInput.onmidimessage = (event) => {
                // console.log(event.data);
                handleMidiInput(event.data);
            };
        }
        else {
            console.log(midiAccess.inputs, midiInput);
            console.log('No MIDI input devices present.');
        }
        if (midiOutput) {
            repaint();
        }
        else {
            console.log('No MIDI output devices present.', midiOutput);
        }
        callback();
    });
}
;
