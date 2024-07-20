import JSONEditor, { JSONEditorOptions } from 'jsoneditor';
import { z } from 'zod';

import 'jsoneditor/dist/img/jsoneditor-icons.svg';
import 'jsoneditor/dist/jsoneditor.css';
import { ConfigSchema } from './schema';

class JsonEditor {
    private container: HTMLElement;
    private editor: JSONEditor;
    private saveButton: HTMLElement;

    constructor() {
        this.container = document.getElementById('jsoneditor')!;
        const options: JSONEditorOptions = {
            mode: 'code',
        };
        this.editor = new JSONEditor(this.container, options);
        this.editor.set({});

        fetch('/data')
            .then((res) => res.text())
            .then((text) => {
                this.editor.set(JSON.parse(text));
            })
            .catch(console.error);

        this.saveButton = document.getElementById('save-button')!;
        this.saveButton.addEventListener('click', () => {
            this.uploadJson.bind(this)().catch(console.error);
        });
    }

    private async uploadJson(): Promise<void> {
        const editedData = this.editor.get() as JSON;

        const result = ConfigSchema.safeParse(editedData);
        if (!result.success) {
            const errors = result.error.errors.map((error) => `[${error.path.join('/')}]: ${error.message}`);
            alert(`Invalid JSON data. Please correct the data before saving.\n\n${errors.join('\n')}`);
            return;
        }

        const resSchema = z.object({ message: z.string() });
        const response = await fetch('/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result.data),
        });
        const text = resSchema.parse(await response.json());
        alert(text.message);
    }
}

new JsonEditor();
