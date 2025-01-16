"use strict";
function addButtons() {
    let randomizeBtn = document.getElementById('randomize');
    randomizeBtn.addEventListener('click', randomize);
    let inputBtn = document.getElementById('inputBtn');
    inputBtn.addEventListener('click', () => {
        let inputId = document.getElementById('inputId').value;
    });
}
function randomize() {
    let color = Math.floor(Math.random() * 127);
    let channel = 0;
    for (let i = 0; i < 127; i++) {
        // 
        let channel = 2;
        let status = 0x90 + channel;
        midiOutput.send([status, i, color]);
    }
}
var midiInput;
var midiAccess;
var midiOutput;
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
        let inputId = "909199967";
        let outputId = "1738695624";
        midiOutput = midiAccess.outputs.get(outputId);
        midiInput = midiAccess.inputs.get(inputId);
        if (midiInput) {
            console.log('Connected to', midiInput.name);
            midiInput.onmidimessage = (event) => {
                console.log(event.data);
            };
        }
        else {
            console.log('No MIDI input devices present.');
        }
        if (midiOutput) {
            randomize();
        }
        else {
            console.log('No MIDI output devices present.', midiOutput);
        }
    });
});
