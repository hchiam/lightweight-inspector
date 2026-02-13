# lightweight-inspector

## 2 goals

1) enable minimally inspecting only a few things in js/css/html in a browser on a mobile device, and

2) make it easier to trust by making it easier to find and read the whole code on GitHub.

## bookmarklet

```js
javascript:(()=>{
    const script = document.createElement('script');
    script.src='https://raw.githubusercontent.com/hchiam/lightweight-inspector/refs/heads/main/script.js';
    document.body.append(script);
})();
```

## code

<https://github.com/hchiam/lightweight-inspector/blob/main/script.js>
