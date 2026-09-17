import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';

// oxlint-disable-next-line typescript/no-non-null-assertion
ReactDOM.createRoot(document.querySelector('#root')!).render(
    <StrictMode>
        <App />,
    </StrictMode>,
);
