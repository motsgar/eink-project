import JSONEditor, { type JSONEditorOptions } from 'jsoneditor';
import { type JSX, useEffect, useState } from 'react';
import { Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { z } from 'zod';

import 'jsoneditor/dist/img/jsoneditor-icons.svg';
import 'jsoneditor/dist/jsoneditor.css';
import { ConfigSchema } from './schema';

const Root = (): JSX.Element => <Outlet />;

const Home = (): JSX.Element => {
    const images = [0, 1, 2].map((index) => `/api/images/${index}`);

    return (
        <div
            id="image-container"
            style={{
                maxWidth: '100%',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
            }}
        >
            {images.map((src) => (
                <img
                    key={src}
                    src={src}
                    style={{
                        maxWidth: 'calc(50% - 5px)',
                        height: 'auto',
                    }}
                />
            ))}
        </div>
    );
};

const editorOptions: JSONEditorOptions = {
    mode: 'code',
};
const Config = (): JSX.Element => {
    const [editor, setEditor] = useState<JSONEditor | null>(null);

    useEffect(() => {
        const container = document.querySelector('#jsoneditor')!;
        const newEditor = new JSONEditor(container, editorOptions);
        newEditor.set({});

        fetch('/api/data')
            .then(async (res) => res.text())
            .then((text) => {
                newEditor.set(JSON.parse(text));
                setEditor(newEditor);
            })
            .catch(console.error);
    }, []);

    const uploadJson = async (): Promise<void> => {
        if (editor === null) return;
        const editedData = editor.get() as JSON;

        const result = ConfigSchema.safeParse(editedData);
        if (!result.success) {
            const errors = result.error.errors.map((error) => `[${error.path.join('/')}]: ${error.message}`);
            alert(`Invalid JSON data. Please correct the data before saving.\n\n${errors.join('\n')}`);
            return;
        }

        const resSchema = z.object({ message: z.string() });
        const response = await fetch('/api/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result.data),
        });
        const text = resSchema.parse(await response.json());
        alert(text.message);
    };
    return (
        <>
            <div id="jsoneditor" style={{ height: '90vh' }} />
            <button
                type="button"
                onClick={() => {
                    uploadJson().catch(console.error);
                }}
                style={{
                    padding: '10px 16px',
                    fontSize: '14px',
                    marginTop: '4px ',
                }}
            >
                Save
            </button>
        </>
    );
};

const router = createBrowserRouter([
    {
        path: '/',
        element: <Root />,
        children: [
            { path: '/', element: <Home /> },
            { path: '/config', element: <Config /> },
        ],
    },
]);

const App = (): JSX.Element => <RouterProvider router={router} />;

export default App;
