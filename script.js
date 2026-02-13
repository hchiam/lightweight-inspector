(() => {
  const $ = (s) => document.querySelector(s);

  const $$ = (s) => [...document.querySelectorAll(s)];

  const dialogSelector = "#lightweight-inspector";
  const inspectorContentsSelector = "#inspector-contents";
  const htmlInspectorSelector = "#html-inspector";
  const cssInspectorSelector = "#css-inspector";
  const jsInspectorSelector = "#js-inspector";
  let dialog = null;
  let inspectorContents = null;

  runMainLogic();
  function runMainLogic() {
    showDialog();
    inspect();
  }

  function el(tagName, insides, attributes) {
    const tag = document.createElement(tagName);
    if (insides) {
      if (typeof insides === "string") {
        tag.innerText = insides;
      } else if (Array.isArray(insides)) {
        insides.forEach((inside) => {
          if (typeof insides === "string") {
            tag.append(el("p", inside));
          } else {
            tag.append(inside);
          }
        });
      } else {
        tag.append(insides);
      }
    }
    if (attributes) {
      Object.entries(attributes).forEach(([attribute, value]) => {
        tag[attribute] = value;
      });
    }
    return tag;
  }

  function showDialog() {
    const alreadyExistingElement = $(dialogSelector);
    if (!alreadyExistingElement) {
      dialog = el("dialog", [
        el("form", el("button", "x"), { method: "dialog" }),
        el("p", "lightweight-inspector", { id: "title" }),
        el("div", null, { id: inspectorContentsSelector.replace("#", "") }),
        el(
          "style",
          `
${dialogSelector},
${dialogSelector}::before,
${dialogSelector}::after,
${dialogSelector} *,
${dialogSelector} *::before,
${dialogSelector} *::after {
    all: revert;
}
${dialogSelector} {
    background: #ffffff80;
    width: 100%;
    height: 100%;
    border-color: #0f0e;
    form {
        position: fixed;
        top: 0.25rem;
        right: 0.25rem;
        button {
            background: #f00e;
            color: white;
            border: none;
            border-radius: 0.5rem;
            padding: 0.25rem;
            cursor: pointer;
            width: 1rem;
            height: 1rem;
            font-size: 0.5rem;
            font-weight: bold;
            display: flex;
            justify-content: center;
            align-items: center;
        }
    }
    #title {
        position: fixed;
        top: -2px;
        left: 0;
        padding: 0;
        margin: 0;
        padding-inline-start: 0.25rem;
        padding-block-start: 0.25rem;
        background: #0f0e;
        color: black;
        height: calc(1rem + 1px);
        line-height: 1rem;
    }
    .white { background: white; }
    .red { background: red; }
    .blue { background: lightblue; }
    .yellow { background: yellow; }
    ${inspectorContentsSelector} {
        height: 100%;
        display: flex;
        flex-direction: column;
        > * {
            flex: 1;
            margin-block: 1.5px;
            overflow: auto;
            p {
                margin: 0;
            }
        }
        ${htmlInspectorSelector} {
            outline: 1px solid red;
            background: #00000080;
            color: white;
            button {
                text-align: start;
            }
        }
        ${cssInspectorSelector} {
            outline: 1px solid blue;
        }
        ${jsInspectorSelector} {
            outline: 1px solid yellow;
            input,
            button {
                position: sticky;
                top: 0;
                z-index: 1;
                min-height: 44px;
                min-width: 44px;
            }
            p {
                opacity: 0.8;
            }
        }
    }
}
`,
        ),
      ]);
      dialog.id = dialogSelector.replace("#", "");
      document.body.append(dialog);
    } else {
      dialog = alreadyExistingElement;
    }
    inspectorContents = dialog.querySelector(inspectorContentsSelector);
    dialog.showModal();
  }

  function inspect() {
    inspectHTML();
    inspectCSS();
    inspectJS();
  }

  function inspectHTML() {
    if ($(htmlInspectorSelector)) return;

    const htmlInspector = el("div", null, {
      id: htmlInspectorSelector.replace("#", ""),
    });
    inspectorContents.append(htmlInspector);

    const elements = turnHtmlTagsIntoButtons(
      new XMLSerializer().serializeToString(document),
    );
    elements.forEach((element) => {
      htmlInspector.append(element);
    });
  }

  function turnHtmlTagsIntoButtons(htmlText) {
    const elements = htmlText.split(/(<(?!\/).+?>)/).map((text, i) => {
      const isStartTag = i % 2 !== 0;
      if (isStartTag) {
        return el("p", el("button", text));
      } else {
        return el("p", text);
      }
    });
    return elements;
  }

  function inspectCSS() {
    if ($(cssInspectorSelector)) return;

    const cssInspector = el("div", null, {
      id: cssInspectorSelector.replace("#", ""),
    });
    inspectorContents.append(cssInspector);
  }

  function inspectJS() {
    if ($(jsInspectorSelector)) return;

    const jsInspector = el("div", null, {
      id: jsInspectorSelector.replace("#", ""),
    });
    inspectorContents.append(jsInspector);

    const consoleInput = el("input", null, {
      id: "console-input",
      placeholder: "js, e.g.: $('body') or $$('p')",
    });
    const consoleInputButton = el("button", "Send", {
      id: "console-input-button",
    });
    jsInspector.append(consoleInput);
    jsInspector.append(consoleInputButton);
    consoleInput.addEventListener("keyup", (event) => {
      if (event.key === "Enter") {
        runConsoleInput(consoleInput);
      }
    });
    consoleInputButton.addEventListener("click", () => {
      runConsoleInput(consoleInput);
    });

    captureConsole({
      logCallback: function () {
        jsInspector.append(createConsoleMessage("white", arguments));
      },
      errorCallback: function () {
        jsInspector.append(createConsoleMessage("red", arguments));
      },
      debugCallback: function () {
        jsInspector.append(createConsoleMessage("white", arguments));
      },
      exceptionCallback: function () {
        jsInspector.append(createConsoleMessage("red", arguments));
      },
      infoCallback: function () {
        jsInspector.append(createConsoleMessage("blue", arguments));
      },
      traceCallback: function () {
        jsInspector.append(createConsoleMessage("white", arguments));
      },
      warnCallback: function () {
        jsInspector.append(createConsoleMessage("yellow", arguments));
      },
    });
  }

  function runConsoleInput(consoleInput) {
    const value = consoleInput.value;
    console.log(value);
    try {
      const output = eval(value);
      console.info(output);
      $(jsInspectorSelector).scrollTo(0, $(jsInspectorSelector).scrollHeight);
    } catch (e) {
      console.error(e);
      $(jsInspectorSelector).scrollTo(0, $(jsInspectorSelector).scrollHeight);
    }
  }

  function captureConsole({
    logCallback,
    errorCallback,
    debugCallback,
    exceptionCallback,
    infoCallback,
    traceCallback,
    warnCallback,
  }) {
    const existingConsolelog = console.log;
    console.log = function () {
      logCallback(...arguments);
      existingConsolelog(...arguments);
    };

    const existingConsoleerror = console.error;
    console.error = function () {
      errorCallback(...arguments);
      existingConsoleerror(...arguments);
    };

    const existingConsoledebug = console.debug;
    console.debug = function () {
      debugCallback(...arguments);
      existingConsoledebug(...arguments);
    };

    const existingConsoleexception = console.exception;
    console.exception = function () {
      exceptionCallback(...arguments);
      existingConsoleexception(...arguments);
    };

    const existingConsoleinfo = console.info;
    console.info = function () {
      infoCallback(...arguments);
      existingConsoleinfo(...arguments);
    };

    const existingConsoletrace = console.trace;
    console.trace = function () {
      traceCallback(...arguments);
      existingConsoletrace(...arguments);
    };

    const existingConsolewarn = console.warn;
    console.warn = function () {
      warnCallback(...arguments);
      existingConsolewarn(...arguments);
    };

    window.addEventListener("error", function (event) {
      errorCallback(JSON.stringify(event));
    });

    window.addEventListener("unhandledrejection", function (event) {
      errorCallback(JSON.stringify(event));
    });
  }

  function createConsoleMessage(colour, args) {
    const argsArray = Array.from(args);
    const text = argsArray.map(handleHtmlElementInConsole).join(" ");
    return el("p", text, { className: colour });
  }

  function handleHtmlElementInConsole(arg) {
    if (arg instanceof HTMLElement) {
      return `<${arg.tagName.toLowerCase()}${Object.values(arg.attributes)
        .map((attr) => " " + attr.name + '="' + attr.value + '"')
        .join("")}>`;
    } else if (Array.isArray(arg)) {
      return (
        "[\n" +
        arg.map((a) => handleHtmlElementInConsole(a)).map((a) => " " + a) +
        "\n]"
      );
    } else {
      return arg;
    }
  }
})();
