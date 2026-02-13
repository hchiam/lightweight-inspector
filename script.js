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
        top: 0;
        left: 0;
        padding: 0;
        margin: 0;
        padding-inline-start: 0.25rem;
        padding-block-start: 0.25rem;
        background: #0f0e;
        color: black;
        font-size: 0.5rem;
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
        }
        ${htmlInspectorSelector} {
            outline: 1px solid red;
        }
        ${cssInspectorSelector} {
            outline: 1px solid blue;
        }
        ${jsInspectorSelector} {
            outline: 1px solid yellow;
            p {
                margin: 0;
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

    const consoleInput = el("input", null, { id: "console-input" });
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
    } catch (e) {
      console.error(e);
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
    } else {
      return arg;
    }
  }
})();
