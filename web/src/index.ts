import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import JSONEditor, { JSONEditorOptions } from 'jsoneditor';
import 'jsoneditor/dist/img/jsoneditor-icons.svg';
import 'jsoneditor/dist/jsoneditor.css';
import schema from './schema.json';

class JsonEditor {
    private container: HTMLElement;
    private editor: JSONEditor;
    private saveButton: HTMLElement;
    private ajv: Ajv;
    private validate: ValidateFunction;

    constructor() {
        this.container = document.getElementById('jsoneditor')!;
        const options: JSONEditorOptions = {
            mode: 'code',
        };
        this.editor = new JSONEditor(this.container, options);
        this.editor.set({});

        this.ajv = new Ajv({ allErrors: true });
        addFormats(this.ajv);
        this.validate = this.ajv.compile(schema);

        fetch('/data')
            .then((res) => res.text())
            .then((text) => {
                this.editor.set(JSON.parse(text));
            })
            .catch(console.error);

        this.saveButton = document.getElementById('save-button')!;
        this.saveButton.addEventListener('click', this.uploadJson.bind(this));
    }

    private async uploadJson(): Promise<void> {
        const editedData = this.editor.get();
        const url = '/update';

        const isValid = this.validate(editedData);
        if (!isValid) {
            if (!this.validate.errors) {
                alert('Invalid JSON data. Please correct the data before saving.');
                return;
            }
            const errors = [];
            for (const error of this.validate.errors) {
                errors.push(`${error.instancePath} ${error.message}`);
            }
            alert(`Invalid JSON data. Please correct the data before saving.\n\n${errors.join('\n')}`);
            return;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editedData),
        });
        const text = await response.json();
        alert(text.message);
    }
}

new JsonEditor();
