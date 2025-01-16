import Grid from './grid.js';
import Minimap from './minimap.js';

var highlightedCell = 0;
var backgroundColor = 0;
document.addEventListener('DOMContentLoaded', () => {
    let grid = new Grid();
    let minimap = new Minimap();
    document.getElementById('grid')!.appendChild(grid.element);
    document.getElementById('minimap')!.appendChild(minimap.element);
});

function addButtons() {
    let randomizeBtn = document.getElementById('randomize');
    randomizeBtn!.addEventListener('click', randomize);
    let inputBtn = document.getElementById('inputBtn');
    inputBtn!.addEventListener('click', () => {
        let inputId = (<HTMLInputElement>document.getElementById('inputId')).value;
        
    });
}


function randomize() {
    let color = Math.floor(Math.random() * 127);
    backgroundColor = color;
    let channel = 0;
    for (let i=0; i<64; i++) {
        let status = 0x90 + channel;
        let row = Math.floor(i / 8) + 1;
        let col = i % 8 + 1;
        let cellIndex = row * 10 + col;
        midiOutput.send([status, cellIndex, color]);  
    }
}

function gridIndex(midiNote){
    let row = 8 - Math.floor(midiNote / 10);
    let col = midiNote % 10 - 1;
    return row * 8 + col;
}

function highlightCell(index, color) {
    if (highlightedCell) {
        let cellIndex = gridIndex(highlightedCell);
        let cell = document.getElementsByClassName('cell')[cellIndex];
        cell.classList.remove('highlight');
        midiOutput.send([0x90, highlightedCell, backgroundColor]);
    }
    let channel = 0;
    let status = 0x90 + channel;
    midiOutput.send([status, index, color]);
    let cellIndex = gridIndex(index);
    let cell = document.getElementsByClassName('cell')[cellIndex];
    cell.classList.add('highlight');
    highlightedCell = index;
}

function handleMidiInput(data) {
    let status = data[0];
    let note = data[1];
    let velocity = data[2];
    let color = Math.floor(Math.random() * 127);
    if (status === 0x90 && velocity > 0) {
        console.log('Note on', note, velocity);
        highlightCell(note, color);
    } else if (status === 176) {
        console.log('CC', note, velocity);
        if (velocity === 127) {
            let channel = 0;
            let status = 0x90 + channel;
            midiOutput.send([status, note, color]);
        }
    }
}   

var midiInput: MIDIInput;
var midiInput2: MIDIInput;
var midiAccess: MIDIAccess;
var midiOutput: MIDIOutput;
document.addEventListener('DOMContentLoaded', () => {

    navigator.requestMIDIAccess().then((access) => {
        addButtons();

        midiAccess = access;
        // list all the inputs
        for (let input of midiAccess.inputs.values()) {
            console.log(input.name, input.id);
        }
        for (let out of midiAccess.outputs.values()) {
            console.log(out.name, out.id);
        }
        let inputId = "909199967"
        let inputId2 = "1823086654"
        let outputId = "1738695624"
        midiOutput = midiAccess.outputs.get(outputId);
        midiInput = midiAccess.inputs.get(inputId);
        if (midiInput) {

            console.log('Connected to input', midiInput.name);
            midiInput.onmidimessage = (event) => {
                console.log(event.data);
                handleMidiInput(event.data);
            };
            
        } else {
            console.log(midiAccess.inputs, midiInput);
            console.log('No MIDI input devices present.');
        }

        if (midiOutput) {
            // enable DAW mode
            // F0h 00h 20h 29h 02h 0Dh 10h <mode> F7h
            // mode 0 = off, 1 = on
            let mode = 1;
            
            // midiOutput.send([0xF0, 0x00, 0x20, 0x29, 0x02, 0x0D, 0x10, 0x00, 0xF7]);
            randomize();

        } else {

            console.log('No MIDI output devices present.', midiOutput);
        }
    });
});