import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import serviceWorkerConfig from './serviceWorkerConfig'
import * as Sentry from '@sentry/react';
import { Integrations } from "@sentry/tracing";

Sentry.init({
    dsn: "https://faebc23b4f554998b7d05c57f25c0815@o91052.ingest.sentry.io/1435575",
    integrations: [
        new Integrations.BrowserTracing(),
    ],
    tracesSampleRate: 0.1,
});
ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register(serviceWorkerConfig);
