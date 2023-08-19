import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import JSONEditor, { JSONEditorOptions } from 'jsoneditor';
import 'jsoneditor/dist/img/jsoneditor-icons.svg';
import 'jsoneditor/dist/jsoneditor.css';
import schema from './schema.json';

const container = document.getElementById('jsoneditor')!;
const options: JSONEditorOptions = {
    mode: 'code',
};
const editor = new JSONEditor(container, options);

const initialJson = {};
editor.set(initialJson);

// Get json from the server
fetch('http://localhost:3000/data')
    .then((res) => res.text())
    .then((text) => {
        editor.set(JSON.parse(text));
    })
    .catch(console.error);

// Send JSON to the server
const saveButton = document.getElementById('save-button')!;
saveButton.addEventListener('click', () => {
    const editedData = editor.get();
    const url = 'http://localhost:3000/update';

    const ajv = new Ajv();
    addFormats(ajv);
    const validate = ajv.compile(schema);
    const isValid = validate(editedData);

    if (!isValid) {
        console.error('Invalid JSON data:', validate.errors);
        alert('Invalid JSON data. Please correct the data before saving.');
        return;
    }

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedData),
    })
        .then((response) => response.text())
        .then((data) => {
            console.log('Server response:', data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
});
