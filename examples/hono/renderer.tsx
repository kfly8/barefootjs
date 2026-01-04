/**
 * BarefootJS Renderer for Hono/JSX
 *
 * Uses hono/jsx-renderer with streaming support.
 * BfScripts component renders collected script tags at body end.
 */

import { jsxRenderer } from 'hono/jsx-renderer'
import { BfScripts } from '../../packages/hono/src/scripts'

export const renderer = jsxRenderer(
  ({ children }) => {
    return (
      <html lang="ja">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>BarefootJS + Hono/JSX</title>
          <style>{`
            body { font-family: system-ui, sans-serif; max-width: 600px; margin: 2rem auto; padding: 0 1rem; }
            h1 { color: #333; }
            nav ul { list-style: none; padding: 0; }
            nav li { margin: 0.5rem 0; }
            nav a { font-size: 1.2rem; }
            .counter { font-size: 3rem; font-weight: bold; }
            .doubled { color: #666; }
            .toggle span { font-size: 2rem; font-weight: bold; margin-right: 1rem; }
            button { font-size: 1.2rem; padding: 0.5rem 1rem; margin: 0.25rem; cursor: pointer; }

            /* Todo styles */
            .status { font-size: 18px; color: #666; margin: 16px 0; }
            .status .count { font-weight: bold; color: #4caf50; }
            .add-form { display: flex; gap: 8px; margin-bottom: 20px; }
            .new-todo-input { flex: 1; font-size: 16px; padding: 12px 16px; border: 2px solid #ddd; border-radius: 8px; outline: none; transition: border-color 0.2s; }
            .new-todo-input:focus { border-color: #2196f3; }
            .add-form .add-btn { margin-top: 0; width: auto; padding: 12px 24px; }
            .todo-list { list-style: none; padding: 0; margin: 0; }
            .todo-item { display: flex; align-items: center; gap: 12px; padding: 16px; margin: 8px 0; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: opacity 0.2s; }
            .todo-item.done { opacity: 0.6; }
            .todo-item.done .todo-text { text-decoration: line-through; color: #999; }
            .todo-text { flex: 1; font-size: 16px; }
            .toggle-btn { font-size: 13px; padding: 6px 12px; cursor: pointer; border: 1px solid #4caf50; background: white; color: #4caf50; border-radius: 4px; transition: all 0.2s; }
            .toggle-btn:hover { background: #4caf50; color: white; }
            .delete-btn { font-size: 13px; padding: 6px 12px; cursor: pointer; border: 1px solid #ff5252; background: white; color: #ff5252; border-radius: 4px; transition: all 0.2s; }
            .delete-btn:hover { background: #ff5252; color: white; }
            .add-btn { margin-top: 0; font-size: 16px; padding: 12px 20px; cursor: pointer; background: #2196f3; color: white; border: none; border-radius: 8px; transition: background 0.2s; }
            .add-btn:hover { background: #1976d2; }

            /* Loading styles */
            .loading { color: #666; font-style: italic; }

            /* Animated Todo List styles */
            .animated-todo-container { margin: 20px 0; }
            .animated-todo-container h2 { margin-bottom: 10px; }
            .item-count { font-size: 16px; color: #666; margin-bottom: 16px; }
            .item-count .count { font-weight: bold; color: #2196f3; }
            .add-controls { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
            .add-input { flex: 1; min-width: 150px; font-size: 16px; padding: 10px 14px; border: 2px solid #ddd; border-radius: 6px; outline: none; transition: border-color 0.2s; }
            .add-input:focus { border-color: #2196f3; }
            .add-multiple-btn { font-size: 14px; padding: 10px 16px; cursor: pointer; background: #9c27b0; color: white; border: none; border-radius: 6px; transition: background 0.2s; }
            .add-multiple-btn:hover { background: #7b1fa2; }
            .remove-all-btn { font-size: 14px; padding: 10px 16px; cursor: pointer; background: #f44336; color: white; border: none; border-radius: 6px; transition: background 0.2s; }
            .remove-all-btn:hover { background: #d32f2f; }

            /* Animated list styles */
            .animated-list { list-style: none; padding: 0; margin: 0; }
            .animated-item {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 14px 16px;
              margin: 6px 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
              animation: slideIn 0.3s ease-out forwards;
              transform-origin: top center;
            }
            .animated-item .item-text { flex: 1; font-size: 16px; font-weight: 500; }
            .remove-btn { font-size: 13px; padding: 6px 14px; cursor: pointer; border: 1px solid rgba(255,255,255,0.5); background: rgba(255,255,255,0.1); color: white; border-radius: 4px; transition: all 0.2s; }
            .remove-btn:hover { background: rgba(255,255,255,0.2); border-color: white; }

            /* Enter animation: fade-in + slide-down */
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translateY(-20px) scaleY(0.8);
              }
              to {
                opacity: 1;
                transform: translateY(0) scaleY(1);
              }
            }
          `}</style>
        </head>
        <body>
          {children}
          <BfScripts />
        </body>
      </html>
    )
  },
  { stream: true }
)
