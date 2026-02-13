(() => {
  const $ = (s) => document.querySelector(s);

  const $$ = (s) => [...document.querySelectorAll(s)];

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

  const dialog = el("dialog", [
    el("form", el("button", "x"), { method: "dialog" }),
    el("p", "lightweight-inspector", { id: "title" }),
    el(
      "style",
      `
#lightweight-inspector,
#lightweight-inspector::before,
#lightweight-inspector::after,
#lightweight-inspector *,
#lightweight-inspector *::before,
#lightweight-inspector *::after {
    all: revert;
}
#lightweight-inspector {
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
        font-size: smaller;
    }
}
`,
    ),
  ]);
  dialog.id = "lightweight-inspector";
  document.body.append(dialog);
  dialog.showModal();
})();
