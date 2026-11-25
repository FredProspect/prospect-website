import { renderToString } from 'react-dom/server';
import { App } from './App';
export { faqs } from './content';

export const render = () => renderToString(<App />);
