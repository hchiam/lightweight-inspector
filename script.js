javascript: (() => {
  const $ = (s) => document.querySelector(s);

  const $$ = (s) => [...document.querySelectorAll(s)];

  const dialogSelector = "#lightweight-inspector";
  const inspectorContentsSelector = "#inspector-contents";
  const htmlInspectorSelector = "#html-inspector";
  const cssInspectorSelector = "#css-inspector";
  const jsInspectorSelector = "#js-inspector";
  const cssTagNameSelector = "#css-tag-name";
  const customCssTextareaForElementSelector = "#custom-css-for-element";
  const customCssTextareaGlobalSelector = "#custom-css-global";
  const inspectedCssPreSelector = "#inspected-css";

  const htmlStickyButtonsContainerID = "html-sticky-buttons-container";
  const refreshButtonID = "refresh-html-button";
  const jumpToBodyButtonID = "jump-to-body-button";

  const dataHashTableID = "data-hash-table-id";

  let dialog = null;
  let inspectorContents = null;

  const indenter = "  ";
  let htmlElementHashTable = {};

  let customCssTextareaForElement = null;
  let customCssTextareaGlobal = null;
  let customCssStyleGlobal = null;
  let inspectedCssPre = null;

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
        tag.setAttribute(attribute, value);
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
    background: #00000080;
    width: 100%;
    height: 100%;
    border-color: #0f0e;
    form {
        position: fixed;
        top: 0.25rem;
        right: 0.25rem;
        z-index: 1;
        button {
            background: #da0e0eee;
            color: white;
            border: none;
            border-radius: 50%;
            padding: 0.25rem;
            cursor: pointer;
            width: 1rem;
            height: 1rem;
            min-width: 44px;
            min-height: 44px;
            font-size: 1rem;
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
        padding-inline: 0.5rem;
        padding-block-start: 0.25rem;
        background: #0f0e;
        color: black;
        height: calc(1rem + 1px);
        line-height: 1rem;
    }
    input,
    button {
        border-radius: 0.5rem;
    }
    .white { background: white; }
    .red { background: pink; }
    .blue { background: lightblue; }
    .yellow { background: yellow; }
    ${inspectorContentsSelector} {
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        > * {
            flex: 1;
            margin-block: 1.5px;
            overflow: auto;
            border-radius: 0.5rem;
            background: #00000080;
            p,
            pre {
                margin: 0;
            }
        }
        ${htmlInspectorSelector} {
            outline: 1px solid orange;
            color: white;
            #${htmlStickyButtonsContainerID} {
                position: sticky;
                inset-inline-start: 0;
                inset-block-start: 0;
                z-index: 1;
                button {
                  min-height: 44px;
                  min-width: 44px;
                  background: #ff9c5eee;
                }
            }
            .start-tag {
                display: flex;
                align-items: center;
                width: max-content;
                margin-block-start: 0.5rem;
                background: #ffa50080;
                clip-path: polygon(10px 0px, 0% 50%, 10px 100%, calc(100% - 10px) 100%, 100% 50%, calc(100% - 10px) 0px);
                .tag-name {
                    min-height: 44px;
                    min-width: 44px;
                }
                span {
                    color: white;
                }
                .attribute-input {
                    background: black;
                    color: orange;
                    border: 1px solid orange;
                    margin-inline-start: 1ch;
                    padding-inline: 0.25rem;
                    min-height: max(44px, 1.5rem);
                    min-width: 44px;
                    width: 44px;
                    font-family: monospace;
                    display: flex;
                    align-items: center;
                }
            }
            .end-tag {
                background: #ffa50080;
                clip-path: polygon(10px 0px, 0% 50%, 10px 100%, calc(100% - 10px) 100%, 100% 50%, calc(100% - 10px) 0px);
                color: white;
                width: max-content;
            }
            summary {
                color: orange;
                pre {
                  display: inline;
                  margin-inline-start: -1rem;
                  cursor: pointer;
                }
            }
        }
        ${cssInspectorSelector} {
            outline: 1px solid #7cb5e0;
            color: #7cb5e0;
            padding: 0.25rem;
            ${customCssTextareaGlobalSelector} {
              display: block;
              position: sticky;
              inset-block-end: 0;
              inset-inline-start: 0;
              white-space: pre;
              background: #fffe;
              color: black;
              font-family: monospace;
              transition: padding 0.2s;
            }
            ${customCssTextareaGlobalSelector},
            ${customCssTextareaForElementSelector} {
                width: 100%;
                height: 25%;
                max-height: 40%;
                overflow: auto;
            }
            ${customCssTextareaForElementSelector} {
                position: sticky;
                inset-inline-start: 0;
            }
            &:has(${customCssTextareaForElementSelector}[data-hash-table-id="-1"]) ${cssTagNameSelector},
            ${customCssTextareaForElementSelector}[data-hash-table-id="-1"] {
                display: none;
            }
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
            button {
                background: #f7ff00ee;
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

    const refreshButton = el("button", "refresh:", {
      id: refreshButtonID,
    });
    refreshButton.addEventListener("click", () => {
      repopulateHtmlInspector(htmlInspector);
    });

    const jumpToBodyButton = el("button", "jump to body", {
      id: jumpToBodyButtonID,
    });
    jumpToBodyButton.addEventListener("click", () => {
      const bodyButton = htmlInspector.querySelector(
        '.tag-name[title="show styles for: body"]',
      );
      bodyButton.scrollIntoView();
      htmlInspector.scrollTop -= bodyButton.offsetHeight;
    });

    const htmlStickyButtonsContainer = el(
      "div",
      [refreshButton, jumpToBodyButton],
      {
        id: htmlStickyButtonsContainerID,
      },
    );
    htmlInspector.append(htmlStickyButtonsContainer);

    repopulateHtmlInspector(htmlInspector);
  }

  function repopulateHtmlInspector(htmlInspector) {
    const scrollTop = htmlInspector.scrollTop;
    const scrollLeft = htmlInspector.scrollLeft;

    clearHtmlInspector(htmlInspector);

    temporarilyRemoveInspectorFromDOM();

    htmlElementHashTable = {};
    populateHtmlInspectorAndTree(htmlInspector);

    temporarilyPutInspectorBackInDOM();

    htmlInspector.scrollTop = scrollTop;
    htmlInspector.scrollLeft = scrollLeft;

    clearCssInspector();
  }

  function clearHtmlInspector(htmlInspector) {
    [...htmlInspector.children]
      .filter((child) => child.id !== htmlStickyButtonsContainerID)
      .forEach((child) => child.remove());
  }

  function temporarilyRemoveInspectorFromDOM() {
    dialog.close();
    document.body.removeChild(dialog);
  }
  function temporarilyPutInspectorBackInDOM() {
    document.body.append(dialog);
    dialog.showModal();
  }

  function populateHtmlInspectorAndTree(
    htmlInspector,
    element = document.documentElement,
    indent = 0,
  ) {
    if (element.nodeType === Node.TEXT_NODE) {
      if (element.textContent.trim()) {
        if (element.textContent.split("\n").filter(Boolean).length < 2) {
          htmlInspector.append(
            el("pre", createIndentedText(element.textContent, indent)),
          );
        } else {
          htmlInspector.append(
            el("details", [
              el(
                "summary",
                el(
                  "pre",
                  el(
                    "i",
                    el(
                      "b",
                      createIndentedText(
                        "(click to show/hide textContent:)",
                        indent,
                      ),
                    ),
                  ),
                ),
              ),
              el("pre", createIndentedText(element.textContent, indent)),
            ]),
          );
        }
      }
    } else if (element.nodeType === Node.ELEMENT_NODE) {
      const htmlString = element.outerHTML;
      const startTag = processHtmlStartTag(htmlString, element, indent);

      htmlInspector.append(startTag);

      [...element.childNodes].forEach((child) => {
        populateHtmlInspectorAndTree(htmlInspector, child, indent + 1);
      });

      const endTag = htmlString.trim().match(/(<\/[^>]+?>)\s*?$/)?.[1];
      if (endTag) {
        htmlInspector.append(
          el("pre", indenter.repeat(indent) + endTag, { class: "end-tag" }),
        );
      }
    }
  }

  function processHtmlStartTag(htmlText, htmlElement, indent = 0) {
    const startTagRegex = /(<(?!\/).+?>)/;
    const text = htmlText.match(startTagRegex)?.[1];
    const hasStartTag = text;
    if (hasStartTag) {
      let hashTableID = -1;
      if (htmlElement) {
        hashTableID = Object.keys(htmlElementHashTable).length;
        htmlElementHashTable[hashTableID] = htmlElement;
      }
      return el(
        "pre",
        [
          el("span", indenter.repeat(indent) + "<"),
          processTagName(text),
          ...processAttributes(text),
        ],
        {
          class: "start-tag",
          [dataHashTableID]: hashTableID,
        },
      );
    } else {
      /* backup: */
      return el("pre", createIndentedText(text, indent));
    }
  }

  function processTagName(startTagText) {
    if (startTagText === "<!DOCTYPE html>") {
      return el("span", startTagText.slice(1));
    } else {
      const tagNameRegex = /<([^ >]+) ?/;
      const tagName = tagNameRegex.exec(startTagText)?.[1];
      const tagNameButton = el("button", tagName, {
        class: "tag-name",
        title: "show styles for: " + tagName,
      });
      tagNameButton.addEventListener("click", () => {
        const element = getElementUniquely(tagNameButton);
        showCSSRules(element);
        $(cssTagNameSelector).innerText = element.tagName + " style=";
        updateCustomCssTextareaHashTableID(tagNameButton);
      });
      return tagNameButton;
    }
  }

  function processAttributes(startTagText) {
    const attributeRegex = / ([^=]+?="[^">]*?")/;
    const matches = startTagText
      .split(attributeRegex)
      .slice(1); /* so search even instead of odd */
    if (!matches.length) {
      if (startTagText === "<!DOCTYPE html>") {
        return [];
      } else {
        return [emptyAttribute(), el("span", ">")];
      }
    } else {
      return [
        emptyAttribute(),
        ...matches.map((text, i) => {
          const isAttribute = i % 2 === 0; /* even index = split delimiters */
          if (isAttribute) {
            const attributeInput = el("input", "", {
              class: "attribute-input",
            });
            attributeInput.value = text;
            updateWidthToFitValue(attributeInput);
            initializeAttributeInputEventListener(attributeInput);
            return attributeInput;
          } else {
            return el("span", text + " ");
          }
        }),
      ];
    }
  }

  function emptyAttribute() {
    const attributeInput = el(
      "input",
      "" /* intentionally empty input to enable adding attribute(s) */,
      {
        class: "attribute-input",
      },
    );
    initializeAttributeInputEventListener(attributeInput);
    return attributeInput;
  }

  function initializeAttributeInputEventListener(attributeInput) {
    const previousText = attributeInput.value;
    attributeInput.addEventListener("focus", () => {
      clearCssInspector();
    });
    attributeInput.addEventListener("keyup", () => {
      updateWidthToFitValue(attributeInput);
    });
    attributeInput.addEventListener("blur", () => {
      updateAttribute(attributeInput, previousText);
    });
  }

  function updateAttribute(
    attributeInput,
    previousText,
    preserveInspectors = false,
  ) {
    const currentText = attributeInput.value.trim();
    if (currentText !== previousText) {
      const isValidAttribute =
        currentText === "" || /^[^=]+?="[^"]*?"$/.test(currentText);
      if (!isValidAttribute) {
        alert(
          'attribute needs to be formatted as atttribute="" even if "" is empty',
        );
        attributeInput.value = previousText;
      } else {
        const [, previousAttribute, previousValue] =
          previousText.match(/^([^=]+?)="([^"]*?)"$/) ?? [];
        const [, currentAttribute, currentValue] =
          currentText.match(/^([^=]+?)="([^"]*?)"$/) ?? [];
        const element = getElementUniquely(attributeInput);
        if (currentAttribute !== previousAttribute) {
          element.removeAttribute(previousAttribute);
        }
        if (currentText) {
          element.setAttribute(currentAttribute, currentValue);
        }
        if (!preserveInspectors) {
          repopulateHtmlInspector($(htmlInspectorSelector));
          clearCssInspector();
        } else {
          updateWidthToFitValue(attributeInput);
        }
      }
    }
  }

  function updateWidthToFitValue(attributeInput) {
    attributeInput.style.width = attributeInput.value.length + 1 + "ch";
  }

  function getElementUniquely(attributeInputOrTagNameButton) {
    const elementHashTableID =
      attributeInputOrTagNameButton.parentElement.getAttribute(dataHashTableID);
    const element = htmlElementHashTable[elementHashTableID];
    return element;
  }

  function createIndentedText(text, indent) {
    return (
      indenter.repeat(indent) +
      text.split("\n").join("\n" + indenter.repeat(indent))
    );
  }

  function inspectCSS() {
    if ($(cssInspectorSelector)) return;

    customCssTextareaForElement = el("textarea", null, {
      id: customCssTextareaForElementSelector.replace("#", ""),
      [dataHashTableID]: -1 /* intentionally invalid */,
      placeholder: "custom css for this element only",
    });

    inspectedCssPre = el("pre", "", {
      id: inspectedCssPreSelector.replace("#", ""),
    });

    customCssTextareaGlobal = el("textarea", null, {
      id: customCssTextareaGlobalSelector.replace("#", ""),
      title: "custom css for all elements - use selectors",
      placeholder: "custom css for all elements - use selectors",
    });
    customCssTextareaGlobal.value = `/* custom css for all elements - use selectors: */
* {
  
}`;

    customCssStyleGlobal = el("style", customCssTextareaGlobal.innerText);

    const cssInspector = el(
      "div",
      [
        el("p", "", { id: cssTagNameSelector.replace("#", "") }),
        customCssTextareaForElement,
        inspectedCssPre,
        customCssTextareaGlobal,
        customCssStyleGlobal,
      ],
      {
        id: cssInspectorSelector.replace("#", ""),
      },
    );
    inspectorContents.append(cssInspector);

    customCssTextareaForElement.addEventListener("keyup", () => {
      const styleValue = customCssTextareaForElement.value
        .trim()
        .replace(/^style=["']?/, "")
        .replace(/["']$/, "")
        .split(/[;\n]/)
        .map((d) => d.trim())
        .join(";")
        .replace(/;;+/g, ";");

      const hashTableID =
        customCssTextareaForElement.getAttribute(dataHashTableID);
      const attributeInput = $(
        `.start-tag[${dataHashTableID}="${hashTableID}"]`,
      ).querySelector(".attribute-input");

      const previousText = attributeInput.value;
      attributeInput.value = styleValue ? `style="${styleValue}"` : "";
      updateAttribute(attributeInput, previousText, true);
    });

    customCssTextareaGlobal.addEventListener("keyup", () => {
      customCssStyleGlobal.innerText = customCssTextareaGlobal.value;
    });
  }

  function updateCustomCssTextareaHashTableID(attributeInputOrTagNameButton) {
    const hashTableID =
      attributeInputOrTagNameButton.parentElement.getAttribute(dataHashTableID);
    customCssTextareaForElement.setAttribute(dataHashTableID, hashTableID);
  }

  function showCSSRules(element) {
    const cssRulesString = getCssRulesString(element);
    const styleAttributeString = getStyleAttributeString(element);

    customCssTextareaForElement.value = styleAttributeString
      .trim()
      .split(";")
      .map((d) => d.trim())
      .join(";\n")
      .trim();

    $(inspectedCssPreSelector).innerText = cssRulesString;
  }

  function getStyleAttributeString(element) {
    return element.getAttribute("style") ?? "";
  }

  function getCssRulesString(element) {
    return getCssRulesArray(element)
      .map((rule) => {
        const [selector, declarations] = rule.split(/\s*[{}]\s*/);
        return `${selector} {
${declarations
  .split(/;\s*/)
  .filter(Boolean)
  .map((d) => "  " + d + ";\n")
  .join("")}}`;
      })
      .join("\n");
  }

  function getCssRulesArray(element) {
    return getCssRulesObjects(element).map((customRuleObject) => {
      return (
        `\n/* ${customRuleObject.href || "?"} */\n` +
        customRuleObject.rule.cssText
      );
    });
  }

  function getCssRulesObjects(element) {
    return [...document.styleSheets]
      .map((sheet) => {
        try {
          const sheetHref = sheet.href;
          return [...sheet.cssRules]
            .filter((rule) => element.matches(rule.selectorText))
            .map((rule) => {
              const customRuleObject = {
                rule: rule,
              };
              if (sheetHref) customRuleObject.href = sheetHref;
              return customRuleObject;
            });
        } catch (e) {
          return [];
        }
      })
      .flat();
  }

  function clearCssInspector() {
    if (customCssTextareaForElement)
      customCssTextareaForElement.setAttribute(dataHashTableID, -1);
    if (inspectedCssPre) inspectedCssPre.innerText = "";
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
    const consoleInputButton = el("button", "send", {
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
      clearCallback: function () {
        [...jsInspector.children]
          .filter(
            (child) => child !== consoleInput && child !== consoleInputButton,
          )
          .forEach((child) => child.remove());
      },
      logCallback: function () {
        jsInspector.append(createConsoleMessage("white", arguments));
        scrollToEndOfConsoleLog();
      },
      errorCallback: function () {
        jsInspector.append(createConsoleMessage("red", arguments));
        scrollToEndOfConsoleLog();
      },
      debugCallback: function () {
        jsInspector.append(createConsoleMessage("white", arguments));
        scrollToEndOfConsoleLog();
      },
      exceptionCallback: function () {
        jsInspector.append(createConsoleMessage("red", arguments));
        scrollToEndOfConsoleLog();
      },
      infoCallback: function () {
        jsInspector.append(createConsoleMessage("blue", arguments));
        scrollToEndOfConsoleLog();
      },
      traceCallback: function () {
        jsInspector.append(createTraceMessage("white", arguments));
        scrollToEndOfConsoleLog();
      },
      warnCallback: function () {
        jsInspector.append(createConsoleMessage("yellow", arguments));
        scrollToEndOfConsoleLog();
      },
    });
  }

  function runConsoleInput(consoleInput) {
    const value = consoleInput.value;
    console.log(value);
    try {
      const output = eval(value);
      console.info(output);
      scrollToEndOfConsoleLog();
    } catch (e) {
      console.error(e);
      scrollToEndOfConsoleLog();
    }
  }

  function scrollToEndOfConsoleLog() {
    $(jsInspectorSelector)?.scrollTo(0, $(jsInspectorSelector).scrollHeight);
  }

  function captureConsole({
    clearCallback,
    logCallback,
    errorCallback,
    debugCallback,
    exceptionCallback,
    infoCallback,
    traceCallback,
    warnCallback,
  }) {
    const existingConsoleclear = console.clear;
    console.clear = function () {
      clearCallback(...arguments);
      existingConsoleclear(...arguments);
    };

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
      errorCallback(event.error);
      traceCallback(getStackTrace());
    });

    window.addEventListener("unhandledrejection", function (event) {
      errorCallback(event.reason);
      traceCallback(getStackTrace());
    });
  }

  function getStackTrace() {
    const obj = {};
    Error.captureStackTrace(obj, getStackTrace);
    return obj.stack;
  }

  function createConsoleMessage(colour, args) {
    const argsArray = Array.from(args);
    const text = argsArray.map(handleHtmlElementInConsole).join(" ");
    return el("p", text, { class: colour });
  }

  function createTraceMessage(colour, args) {
    const argsArray = Array.from(args);
    const text = argsArray.map(handleHtmlElementInConsole).join(" ");
    return el("details", el("p", text, { class: colour }));
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
