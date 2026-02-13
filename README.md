# lightweight-inspector

## 2 goals

1) enable minimally inspecting only a few things in js/css/html in a browser on a mobile device, and

2) make it easier to trust by making it easier to find and read the whole code on GitHub.

## bookmarklet

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

## code

<https://github.com/hchiam/lightweight-inspector/blob/main/script.js>
