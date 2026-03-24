# lightweight-inspector

Just one of the things I'm working on. <https://github.com/hchiam/learning>

## 2 goals

1) enable minimally inspecting only a few things in js/css/html in a browser on a mobile device, and

2) make it easier to trust by making it easier to find and read [the whole code on GitHub](https://github.com/hchiam/lightweight-inspector/blob/main/script.js). (no deps)

## script.js code

<https://github.com/hchiam/lightweight-inspector/blob/main/script.js>

## [bookmarklet](https://github.com/hchiam/learning-js/tree/main/bookmarklets#bookmarklets) to run the [script.js](https://github.com/hchiam/lightweight-inspector/blob/main/script.js)

_**MAKE SURE YOU UNDERSTAND THE CODE IN
[script.js](https://github.com/hchiam/lightweight-inspector/blob/main/script.js)
BEFORE YOU USE THIS OR ANY BOOKMARKLET CLAIMING TO USE IT!**_

### bookmarklet to automatically use the latest [version](https://github.com/hchiam/lightweight-inspector/releases)

<details>
<summary>(click to expand)</summary>

```js
javascript:(()=>{
    const src = 'https://raw.githubusercontent.com/hchiam/lightweight-inspector/refs/heads/main/script.js';
    try {
        if (!document.addedLightweightInspectorSecuritypolicyviolationEventListener) {
            document.addedLightweightInspectorSecuritypolicyviolationEventListener = true;
            document.addEventListener('securitypolicyviolation', (e) => {
                alert(`CSP blocking lightweight-inspector`);
            });
        }
        fetch(src).then(x=>x.text()).then(x=>{eval(x);});
    } catch(e) {
        try {
            const script = document.createElement('script');
            script.src = src;
            document.body.append(script);
        } catch(e) {
            alert(`couldn't start lightweight-inspector`);
        }
    }
})();
```

</details>

### bookmarklet example locked to [version](https://github.com/hchiam/lightweight-inspector/releases) **0.0.9**

to avoid automatic updates:

<details>
<summary>(click to expand)</summary>

```js
javascript:(()=>{
    const src = 'https://raw.githubusercontent.com/hchiam/lightweight-inspector/0.0.9/script.js';
    try {
        if (!document.addedLightweightInspectorSecuritypolicyviolationEventListener) {
            document.addedLightweightInspectorSecuritypolicyviolationEventListener = true;
            document.addEventListener('securitypolicyviolation', (e) => {
                alert(`CSP blocking lightweight-inspector`);
            });
        }
        fetch(src).then(x=>x.text()).then(x=>{eval(x);});
    } catch(e) {
        try {
            const script = document.createElement('script');
            script.src = src;
            document.body.append(script);
        } catch(e) {
            alert(`couldn't start lightweight-inspector`);
        }
    }
})();
```

</details>

## with [console-log-element](https://github.com/hchiam/console-log-element)

Firefox _on mobile_ seems to make it a little harder to run bookmarklets from your saved bookmarks. if you're using [console-log-element](https://github.com/hchiam/console-log-element) to run the above [bookmarklet](https://github.com/hchiam/learning-js/tree/main/bookmarklets#bookmarklets) in Firefox _on mobile_, here's a helpful code snippet to hide it when you don't need it anymore:

```js
$('#firefox-extension-console-log-element')?.remove();$('#script_firefox-extension-console-log-element')?.remove();
```

## local development

using [`bun`](https://github.com/hchiam/learning-bun):

```sh
bun dev
```

this will automatically run <http://localhost:3000/example>

and for Howard to deploy to <https://lightweight-inspector.vercel.app>

```sh
bun run deploy
```
