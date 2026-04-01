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
  const inspectedCssContainerSelector = "#inspected-css-rules-container";
  const inspectedCssSourceSelector = ".inspected-css-source";
  const inspectedCssTextareaSelector = ".inspected-css-rule";
  const customCssTextareaGlobalSelector = "#custom-css-global";

  const htmlStickyButtonsContainerID = "html-sticky-buttons-container";
  const refreshButtonID = "refresh-html-button";
  const jumpToBodyButtonID = "jump-to-body-button";

  const dataHashTableID = "data-hash-table-id";
  const textContentInputSelector = ".text-content-input";
  const treeToggleSelector = ".tree-toggle";

  let dialog = null;
  let inspectorContents = null;

  const indenter = "  ";
  const indentUnit = 2;
  const toggleWidth = 2;
  let htmlElementHashTable = {};

  let customCssTextareaForElement = null;
  let customCssTextareaGlobal = null;
  let inspectedCssContainer = null;

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
      const versionFromFetchUrl = getVersionFromFetchUrl();
      dialog = el("dialog", [
        el("form", el("button", "x"), { method: "dialog" }),
        el(
          "p",
          "lightweight-inspector" +
            (versionFromFetchUrl ? " " + versionFromFetchUrl : ""),
          {
            id: "title",
          },
        ),
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
${dialogSelector},
${dialogSelector} * {
  box-sizing: border-box;
}
${dialogSelector} {
  --gap: 4px;
  --z-sticky: 1;
  --z-close-button: calc(var(--z-sticky) + 1);
  overscroll-behavior: contain;
  background: rgba(13, 13, 23, 0.6);
  width: calc(100% - var(--gap) * 2);
  height: calc(100% - var(--gap) * 2);
  max-width: calc(100% - var(--gap) * 2);
  max-height: calc(100% - var(--gap) * 2);
  margin: var(--gap);
  border: 0.125rem solid #06ca9c;
  border-radius: 0.5rem;
  font-family: monospace;
  font-size: 1rem;
  form {
    position: fixed;
    top: 0.25rem;
    right: 0.25rem;
    z-index: var(--z-close-button);
    button {
      background: rgba(220, 50, 50, 0.85);
      color: white;
      border: none;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.5);
      padding: 0.25rem;
      cursor: pointer;
      min-width: 44px;
      min-height: 44px;
      font-size: 1rem;
      font-weight: bold;
      font-family: monospace;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
  #title {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    margin: 0;
    padding-inline: 0.5rem;
    padding-block-start: 0.25rem;
    padding-block-end: 0.1rem;
    background: #06ca9c;
    color: black;
    width: fit-content;
    border-end-end-radius: 0.5rem;
    font-size: 0.75rem;
  }
  input,
  button {
    border-radius: 0.5rem;
    font-family: monospace;
  }
  .white { background: rgba(255,255,255,0.07); color: #e2e8f0; }
  .red { background: rgba(220,38,38,0.18); color: #fca5a5; }
  .blue { background: rgba(59,130,246,0.18); color: #bfdbfe; }
  .yellow { background: rgba(234,179,8,0.18); color: #fde68a; }
  ${inspectorContentsSelector} {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-block-start: calc(0.75rem + 0.25rem + 0.1rem);
    > * {
      flex: 1;
      overflow: auto;
      border-radius: 0.5rem;
      background: rgba(13, 13, 23, 0.5);
      position: relative;
      p,
      pre {
        margin: 0;
      }
      &.collapsed {
        max-height: 3rem;
        overflow: hidden;
        flex: none;
      }
      .section-collapse-btn {
        position: sticky;
        top: 0.25rem;
        left: 0.25rem;
        margin-right: 0.5rem;
        z-index: 10;
        background: rgba(0,0,0,0.5);
        color: rgba(255,255,255,0.7);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 0.25rem;
        width: 1.5rem;
        height: 1.5rem;
        line-height: 1.5rem;
        cursor: pointer;
        padding: 0;
        min-width: unset;
        min-height: unset;
      }
      &.collapsed .section-collapse-btn {
        background: rgba(255,255,255,0.9);
        color: rgba(0,0,0,0.8);
        border: 1px solid rgba(255,255,255,0.9);
      }
    }
    ${htmlInspectorSelector} {
      border-left: 3px solid rgba(251,146,60,0.6);
      color: #fed7aa;
      #${htmlStickyButtonsContainerID} {
        position: sticky;
        inset-inline-start: 0;
        inset-block-start: 0;
        z-index: var(--z-sticky);
        display: inline-flex;
        gap: 0.3rem;
        padding: 0.3rem;
        background: rgba(13, 13, 23, 0.6);
        border-bottom: 1px solid rgba(251,146,60,0.2);
        border-end-end-radius: 0.5rem;
        button {
          min-height: 44px;
          min-width: 44px;
          background: rgba(251,146,60,0.75);
          color: rgba(20,10,0,0.9);
          border: none;
          cursor: pointer;
          font-family: monospace;
        }
      }
      .start-tag {
        display: flex;
        align-items: center;
        width: max-content;
        margin-block-start: 0.5rem;
        background: rgba(251,146,60,0.1);
        clip-path: polygon(10px 0px, 0% 50%, 10px 100%, calc(100% - 10px) 100%, 100% 50%, calc(100% - 10px) 0px);
        .tag-name {
          min-height: 44px;
          min-width: 44px;
          color: rgba(20, 8, 0, 0.9);
          background: rgba(251,146,60,0.7);
          border: none;
          border-radius: 0.25rem;
          cursor: pointer;
        }
        span {
          color: rgba(254,215,170,0.55);
        }
        .attribute-input {
          appearance: none;
          background: rgba(0, 0, 0, 0.6);
          color: #fb923c;
          border: 1px solid rgba(251,146,60,0.2);
          margin-inline-start: 0.5rem;
          padding-inline: 0.25rem;
          min-height: max(44px, 1.5rem);
          min-width: 44px;
          width: 44px;
          font-family: inherit;
          display: flex;
          align-items: center;
        }
      }
      .end-tag {
        background: rgba(251,146,60,0.06);
        clip-path: polygon(10px 0px, 0% 50%, 10px 100%, calc(100% - 10px) 100%, 100% 50%, calc(100% - 10px) 0px);
        color: rgba(254,215,170,0.45);
        width: max-content;
      }
      ${textContentInputSelector} {
        background: rgba(0,0,0,0.35);
        color: #fb923c;
        border: 1px solid rgba(251,146,60,0.2);
        padding-inline: 0.25rem;
        font-family: inherit;
        display: block;
        width: max(1000px, 100dvw);
        text-wrap: nowrap;
        overflow: auto;
        resize: none;
      }
      summary {
        color: #fb923c;
        display: flex;
        align-items: center;
        list-style: none;
        &::-webkit-details-marker {
          display: none;
        }
        ${treeToggleSelector} {
          flex-shrink: 0;
          transition: transform 0.2s;
          transform-origin: center;
          cursor: pointer;
          width: 0;
          height: 0;
          border-block: ${toggleWidth * 0.5}rem solid transparent;
          border-inline-start: ${toggleWidth}rem solid rgba(251,146,60,0.9);
          border-inline-end: none;
        }
        pre:not(.start-tag) {
          display: inline;
          cursor: pointer;
        }
      }
      details[open] > summary > ${treeToggleSelector} {
        transform: rotate(90deg);
      }
      details {
        margin-block-start: 0.5rem;
      }
      summary > .start-tag {
        display: inline-flex;
        margin-block-start: 0;
      }
    }
    ${cssInspectorSelector} {
      border-left: 3px solid rgba(96,165,250,0.6);
      color: #bfdbfe;
      ${cssTagNameSelector} {
        position: absolute;
        top: 0;
        left: 2rem;
      }
      &.collapsed {
        ${cssTagNameSelector} {
          position: sticky;
          width: fit-content;
        }
        div, p:not(${cssTagNameSelector}), textarea {
          opacity: 0.5;
        }
      }
      ${cssTagNameSelector},
      ${inspectedCssSourceSelector} {
        font-size: 0.75rem;
        padding-inline: 0.25rem;
        margin-block-start: 0.5rem;
        margin-block-end: 0;
        color: #00cece;
      }
      ${customCssTextareaForElementSelector},
      ${inspectedCssTextareaSelector},
      ${customCssTextareaGlobalSelector} {
        display: block;
        white-space: pre;
        background: rgba(0,0,0,0.35);
        color: #bfdbfe;
        font-family: inherit;
        border: 1px solid rgba(96,165,250,0.2);
        border-radius: 0.375rem;
        transition: padding 0.2s;
        width: calc(100% - 1rem * 2);
        min-height: 1rem;
        min-height: 1lh;
        margin: 0;
        margin-inline-start: 1rem;
        overflow: auto;
        font-family: inherit;
        &::placeholder {
          font-style: italic;
        }
      }
      ${inspectedCssContainerSelector} {
        &:empty {
          display: none;
        }
      }
      &:has(${customCssTextareaForElementSelector}[data-hash-table-id="-1"]) ${cssTagNameSelector},
      ${customCssTextareaForElementSelector}[data-hash-table-id="-1"] {
        display: none;
      }
    }
    ${jsInspectorSelector} {
      border-left: 3px solid rgba(250,204,21,0.6);
      input,
      button:not(.section-collapse-btn) {
        position: sticky;
        top: 0;
        z-index: var(--z-sticky);
        min-height: 44px;
        min-width: 44px;
      }
      input {
        background: rgba(0,0,0,0.35);
        color: #fde68a;
        border: 1px solid rgba(250,204,21,0.2);
        padding-inline: 0.5rem;
        font-family: inherit;
        &::placeholder {
          font-style: italic;
        }
      }
      button:not(.section-collapse-btn) {
        background: rgba(250,204,21,0.8);
        color: rgba(20,15,0,0.9);
        border: none;
        cursor: pointer;
      }
      #console-clear-button {
        margin-inline-start: 1rem;
      }
      p {
        opacity: 0.9;
      }
    }
    ${htmlInspectorSelector} .attribute-input:focus {
      background: rgba(0, 0, 0, 0.7);
    }
    ${htmlInspectorSelector} ${textContentInputSelector}:focus,
    ${cssInspectorSelector} ${customCssTextareaForElementSelector}:focus,
    ${cssInspectorSelector} ${inspectedCssTextareaSelector}:focus,
    ${cssInspectorSelector} ${customCssTextareaGlobalSelector}:focus,
    ${jsInspectorSelector} input:focus {
      background: rgba(0, 0, 0, 0.5);
    }
    ${htmlInspectorSelector},
    ${cssInspectorSelector},
    ${jsInspectorSelector} {
      & input:focus,
      & textarea:focus {
        background: rgba(0, 0, 0, 0.5);
      }
    }
  }
}
`,
        ),
      ]);
      dialog.id = dialogSelector.replace("#", "");
      let touchStartY = 0;
      dialog.addEventListener(
        "touchstart",
        (e) => {
          touchStartY = e.touches[0].clientY;
        },
        { passive: true },
      );
      dialog.addEventListener(
        "touchmove",
        (e) => {
          const deltaY = e.touches[0].clientY - touchStartY;
          let el = e.target;
          while (el && el !== dialog) {
            const overflow = getComputedStyle(el).overflowY;
            if (overflow === "scroll" || overflow === "auto") {
              const atTop = el.scrollTop === 0;
              const atBottom =
                el.scrollTop + el.clientHeight >= el.scrollHeight;
              if ((deltaY > 0 && !atTop) || (deltaY < 0 && !atBottom)) return;
              break;
            }
            el = el.parentElement;
          }
          e.preventDefault();
        },
        { passive: false },
      );
      document.body.append(dialog);
    } else {
      dialog = alreadyExistingElement;
    }
    inspectorContents = dialog.querySelector(inspectorContentsSelector);
    dialog.showModal();
  }

  function getVersionFromFetchUrl() {
    const entries = performance.getEntriesByType("resource");
    for (const entry of entries) {
      const match = entry.name.match(
        /lightweight-inspector\/(.+?)\/script\.js/,
      );
      if (match && !match[1].includes("main")) return match[1];
    }
    return null;
  }

  function inspect() {
    inspectHTML();
    inspectCSS();
    inspectJS();
  }

  function inspectHTML() {
    if (dialog.querySelector(htmlInspectorSelector)) return;

    const htmlInspector = el("section", null, {
      id: htmlInspectorSelector.replace("#", ""),
    });
    inspectorContents.append(htmlInspector);

    const refreshButton = el("button", "refresh", {
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

    addCollapseToggle(htmlInspector);

    repopulateHtmlInspector(htmlInspector);
  }

  function addCollapseToggle(section, onExpand) {
    const btn = el("button", "-", { class: "section-collapse-btn" });
    btn.title = "collapse section";
    btn.addEventListener("click", () => {
      const collapsed = section.classList.toggle("collapsed");
      btn.textContent = collapsed ? "+" : "-";
      btn.title = collapsed ? "expand section" : "collapse section";
      if (!collapsed) onExpand?.();
    });
    section.prepend(btn);
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
      .filter(
        (child) =>
          child.id !== htmlStickyButtonsContainerID &&
          !child.classList.contains("section-collapse-btn"),
      )
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
    parentContainer = null,
  ) {
    const container = parentContainer ?? htmlInspector;

    if (element.nodeType === Node.TEXT_NODE) {
      if (element.textContent.trim()) {
        const textContentTextarea = el("textarea", null, {
          class: textContentInputSelector.replace(".", ""),
          rows: "1",
        });
        textContentTextarea.value = element.textContent;
        textContentTextarea.addEventListener("keyup", () => {
          element.textContent = textContentTextarea.value;
          autoResizeTextarea(textContentTextarea);
        });
        textContentTextarea.addEventListener("focus", () => {
          const hashTableID = Object.values(htmlElementHashTable).indexOf(
            element.parentElement,
          );
          if (hashTableID >= 0) {
            const tagNameButton = dialog.querySelector(
              `.start-tag[${dataHashTableID}="${hashTableID}"] .tag-name`,
            );
            if (tagNameButton) showTagCSSRules(tagNameButton);
          }
        });
        if (element.textContent.split("\n").filter(Boolean).length < 2) {
          textContentTextarea.style.marginInlineStart = `${indent * indentUnit}rem`;
          container.append(textContentTextarea);
        } else {
          const detailsEl = el(
            "details",
            [
              el(
                "summary",
                el(
                  "pre",
                  el("i", el("b", "(click to show/hide textContent:)")),
                ),
              ),
              textContentTextarea,
            ],
            { style: `margin-inline-start: ${indent * indentUnit}rem` },
          );
          detailsEl.addEventListener("toggle", () => {
            if (detailsEl.open) {
              autoResizeTextarea(textContentTextarea);
            }
          });
          container.append(detailsEl);
        }
      }
    } else if (element.nodeType === Node.ELEMENT_NODE) {
      const htmlString = element.outerHTML;
      const endTagText = htmlString
        .trim()
        .match(/<\/[^>]+?>/g)
        ?.at(-1);

      if (endTagText) {
        const startTag = processHtmlStartTag(htmlString, element, 0);
        const details = el("details", null, { open: "" });
        const toggle =
          indent > 0
            ? el("span", null, {
                class: treeToggleSelector.replace(".", ""),
              })
            : null;
        if (toggle)
          toggle.style.marginInlineStart = `${indent * indentUnit - toggleWidth}rem`;
        const summary = el("summary", [toggle, startTag].filter(Boolean));
        summary.addEventListener("click", (event) => {
          event.preventDefault();
          if (toggle?.contains(event.target)) {
            details.open = !details.open;
          }
        });
        details.append(summary);

        [...element.childNodes].forEach((child) => {
          populateHtmlInspectorAndTree(
            htmlInspector,
            child,
            indent + 1,
            details,
          );
        });

        details.append(
          Object.assign(el("pre", endTagText, { class: "end-tag" }), {
            style: `margin-inline-start: ${indent * indentUnit}rem`,
          }),
        );
        container.append(details);
      } else {
        const startTag = processHtmlStartTag(htmlString, element, indent);
        container.append(startTag);
        [...element.childNodes].forEach((child) => {
          populateHtmlInspectorAndTree(
            htmlInspector,
            child,
            indent + 1,
            container,
          );
        });
      }
    }
  }

  function autoResizeTextarea(textarea) {
    textarea.style.height = "auto";
    const minHeight = 24;
    const maxHeight = textarea.closest("section").clientHeight / 2;
    textarea.style.height =
      Math.max(minHeight, Math.min(maxHeight, textarea.scrollHeight)) + "px";
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
      const pre = el(
        "pre",
        [el("span", "<"), processTagName(text), ...processAttributes(text)],
        {
          class: "start-tag",
          [dataHashTableID]: hashTableID,
        },
      );
      pre.style.marginInlineStart = `${indent * indentUnit}rem`;
      return pre;
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
        showTagCSSRules(tagNameButton);
      });
      return tagNameButton;
    }
  }

  function showTagCSSRules(tagNameButton) {
    const element = getElementUniquely(tagNameButton);
    showCSSRules(element);
    const tagId = element.id ? "#" + element.id : "";
    const tagClasses = element.classList.length
      ? "." + [...element.classList].join(".")
      : "";
    dialog.querySelector(cssTagNameSelector).innerText =
      element.tagName.toLowerCase() + tagId + tagClasses;
    updateCustomCssTextareaHashTableID(tagNameButton);
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
      const tagNameButton = attributeInput
        .closest(".start-tag")
        .querySelector(".tag-name");
      showTagCSSRules(tagNameButton);
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
          repopulateHtmlInspector(dialog.querySelector(htmlInspectorSelector));
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
    if (dialog.querySelector(cssInspectorSelector)) return;

    customCssTextareaForElement = el("textarea", null, {
      id: customCssTextareaForElementSelector.replace("#", ""),
      [dataHashTableID]: -1 /* intentionally invalid */,
      placeholder: "custom css for this element only, e.g. color:red;",
    });

    inspectedCssContainer = el("div", null, {
      id: inspectedCssContainerSelector.replace("#", ""),
    });

    customCssTextareaGlobal = el("textarea", null, {
      id: customCssTextareaGlobalSelector.replace("#", ""),
      title: "custom css for all elements - use selectors",
      placeholder: "custom css for all elements - use selectors",
    });
    customCssTextareaGlobal.value = `/* custom css for all elements - use selectors: */
* {
  
}`;

    const customCssStyleGlobal = el("style", customCssTextareaGlobal.innerText);

    const cssInspector = el(
      "section",
      [
        el("p", "", { id: cssTagNameSelector.replace("#", "") }),
        customCssTextareaForElement,
        inspectedCssContainer,
        el("p", "global custom css:", {
          class: inspectedCssSourceSelector.replace(".", ""),
        }),
        customCssTextareaGlobal,
        customCssStyleGlobal,
      ],
      {
        id: cssInspectorSelector.replace("#", ""),
      },
    );
    inspectorContents.append(cssInspector);

    autoResizeTextarea(customCssTextareaForElement);
    autoResizeTextarea(customCssTextareaGlobal);

    customCssTextareaForElement.addEventListener("keyup", () => {
      autoResizeTextarea(customCssTextareaForElement);

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
      const startTag = dialog.querySelector(
        `.start-tag[${dataHashTableID}="${hashTableID}"]`,
      );
      const allAttributeInputs = [
        ...startTag.querySelectorAll(".attribute-input"),
      ];
      const attributeInput =
        allAttributeInputs.find((input) => /^style\s*=/i.test(input.value)) ??
        allAttributeInputs[0];

      const previousText = attributeInput.value;
      attributeInput.value = styleValue ? `style="${styleValue}"` : "";
      updateAttribute(attributeInput, previousText, true);
    });

    customCssTextareaGlobal.addEventListener("keyup", () => {
      autoResizeTextarea(customCssTextareaGlobal);
      customCssStyleGlobal.innerText = customCssTextareaGlobal.value;
    });

    addCollapseToggle(cssInspector, () => {
      autoResizeTextarea(customCssTextareaForElement);
      autoResizeTextarea(customCssTextareaGlobal);
      [...dialog.querySelectorAll(inspectedCssTextareaSelector)].forEach(
        autoResizeTextarea,
      );
    });
  }

  function updateCustomCssTextareaHashTableID(attributeInputOrTagNameButton) {
    const hashTableID =
      attributeInputOrTagNameButton.parentElement.getAttribute(dataHashTableID);
    customCssTextareaForElement.setAttribute(dataHashTableID, hashTableID);
  }

  function showCSSRules(element) {
    const styleAttributeString = element.getAttribute("style") ?? "";
    customCssTextareaForElement.value = styleAttributeString
      .trim()
      .split(";")
      .map((d) => d.trim())
      .join(";\n")
      .trim();
    autoResizeTextarea(customCssTextareaForElement);
    customCssTextareaForElement.scrollTop = 0;
    dialog.querySelector(cssInspectorSelector).scrollTop = 0;

    const inspectedCssRuleTextareas = [];
    inspectedCssContainer.replaceChildren(
      ...getCssRulesObjects(element).map((customRuleObject) => {
        const [selector, declarations] =
          customRuleObject.rule.cssText.split(/\s*[{}]\s*/);

        const formattedCssText = `${selector.trim()} {\n${declarations
          .split(/;\s*/)
          .filter(Boolean)
          .map((d) => "  " + d + ";\n")
          .join("")}}`;

        const sourcePath = el("p", customRuleObject.href ?? "inline <style>", {
          class: inspectedCssSourceSelector.replace(".", ""),
        });
        const cssTextTextarea = el("textarea", null, {
          class: inspectedCssTextareaSelector.replace(".", ""),
        });
        cssTextTextarea.value = formattedCssText;
        cssTextTextarea.addEventListener("keyup", () => {
          autoResizeTextarea(cssTextTextarea);
          const stylesheet = customRuleObject.rule.parentStyleSheet;
          const ruleIndex = [...stylesheet.cssRules].indexOf(
            customRuleObject.rule,
          );
          if (ruleIndex === -1) return;
          try {
            stylesheet.deleteRule(ruleIndex);
            stylesheet.insertRule(cssTextTextarea.value, ruleIndex);
            customRuleObject.rule = stylesheet.cssRules[ruleIndex];
          } catch (e) {
            /* invalid CSS mid-edit, ignore */
          }
        });
        inspectedCssRuleTextareas.push(cssTextTextarea);
        return el("div", [sourcePath, cssTextTextarea]);
      }),
    );
    inspectedCssRuleTextareas.forEach((textarea) =>
      autoResizeTextarea(textarea),
    );
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
    if (inspectedCssContainer) inspectedCssContainer.replaceChildren();
  }

  function inspectJS() {
    if (dialog.querySelector(jsInspectorSelector)) return;

    const jsInspector = el("section", null, {
      id: jsInspectorSelector.replace("#", ""),
    });
    inspectorContents.append(jsInspector);

    const consoleInput = el("input", null, {
      id: "console-input",
      placeholder: "js, e.g.: $('body') or $$('p')",
    });
    const consoleInputButton = el("button", "run", {
      id: "console-input-button",
    });
    const consoleClearButton = el("button", "clear", {
      id: "console-clear-button",
    });
    jsInspector.append(consoleInput);
    jsInspector.append(consoleInputButton);
    jsInspector.append(consoleClearButton);
    consoleInput.addEventListener("keyup", (event) => {
      if (event.key === "Enter") {
        runConsoleInput(consoleInput);
      }
    });
    consoleInputButton.addEventListener("click", () => {
      runConsoleInput(consoleInput);
    });

    const clearConsoleMessages = () => {
      [...jsInspector.children]
        .filter(
          (child) =>
            child !== consoleInput &&
            child !== consoleInputButton &&
            child !== consoleClearButton &&
            !child.classList.contains("section-collapse-btn"),
        )
        .forEach((child) => child.remove());
    };

    consoleClearButton.addEventListener("click", () => {
      const yes = confirm("are you sure you want to clear console?");
      if (yes) clearConsoleMessages();
    });

    captureConsole({
      clearCallback: clearConsoleMessages,
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

    addCollapseToggle(jsInspector);
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
    dialog
      .querySelector(jsInspectorSelector)
      ?.scrollTo(0, dialog.querySelector(jsInspectorSelector).scrollHeight);
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
