# lightweight-inspector

## 2 goals

1) enable minimally inspecting only a few things in js/css/html in a browser on a mobile device, and

2) make it easier to trust by making it easier to find and read [the whole code on GitHub](https://github.com/hchiam/lightweight-inspector/blob/main/script.js).

## script.js code

<https://github.com/hchiam/lightweight-inspector/blob/main/script.js>

## [bookmarklet](https://github.com/hchiam/learning-js/tree/main/bookmarklets#bookmarklets) to run the [script.js](https://github.com/hchiam/lightweight-inspector/blob/main/script.js)

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

## with [console-log-element](https://github.com/hchiam/console-log-element)

if you're using [console-log-element](https://github.com/hchiam/console-log-element) to run the above [bookmarklet](https://github.com/hchiam/learning-js/tree/main/bookmarklets#bookmarklets) on Firefox, here's a helpful code snippet to hide it when you don't need it anymore:

```js
$('#firefox-extension-console-log-element')?.remove();$('#script_firefox-extension-console-log-element')?.remove();
```
