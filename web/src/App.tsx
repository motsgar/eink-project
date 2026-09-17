// oxlint-disable react/no-multi-comp no-console
import type { JSONEditorOptions } from 'jsoneditor';
import type { JSX } from 'react';

import JSONEditor from 'jsoneditor';
import { useEffect, useState } from 'react';
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

const editorOptions: JSONEditorOptions = { mode: 'code' };
const Config = (): JSX.Element => {
    const [editor, setEditor] = useState<JSONEditor | null>(null);

    useEffect(() => {
        // oxlint-disable-next-line typescript/no-non-null-assertion
        const container = document.querySelector<HTMLElement>('#jsoneditor')!;
        const newEditor = new JSONEditor(container, editorOptions);
        newEditor.set({});

        const loadData = async (): Promise<void> => {
            try {
                const res = await fetch('/api/data');
                const text = await res.text();

                newEditor.set(JSON.parse(text));
                setEditor(newEditor);
            } catch (error) {
                console.error(error);
            }
        };

        void loadData();
    }, []);

    const uploadJson = async (): Promise<void> => {
        if (editor === null) return;
        const editedData = editor.get() as JSON;

        const result = ConfigSchema.safeParse(editedData);
        if (!result.success) {
            const errors = result.error.issues.map((error) => `[${error.path.join('/')}]: ${error.message}`);
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
                    // oxlint-disable-next-line promise/prefer-await-to-then
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
