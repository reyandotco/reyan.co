function h(tag, childOrAttrs, ...children) {
  const element = document.createElement(tag);
  if (childOrAttrs instanceof Node || typeof childOrAttrs === "string") {
    element.append(childOrAttrs, ...children);
  } else {
    Object.assign(element, childOrAttrs);
    element.append(...children);
  }
  return element;
}

const charSpans = {};

function charClassName(state, i) {
  return i === state.cursor
    ? "cursor"
    : i < state.cursor
    ? state.text[i].miss
      ? "miss"
      : "hit"
    : "";
}

function renderChar(state, i) {
  const charSpan = h(
    "span",
    { className: charClassName(state, i) },
    state.text[i].target
  );
  charSpans[i] = charSpan;
  return charSpan;
}

function renderText(state) {
  return h("span", ...state.text.map((_, i) => renderChar(state, i)), "\n\n");
}

let resultsSpan;

function renderResults(state) {
  const wpm = Math.floor(
    (12000 * state.cursor) / ((state.finish || Date.now()) - state.start)
  );
  const accuracy = Math.floor((100 * state.hits) / (state.hits + state.misses));
  let results;
  if (state.finish) {
    results = `${wpm} wpm [${accuracy}%]`;
  } else if (state.cursor > 3) {
    const miss = state.text.findIndex((c) => c.miss);
    if (
      miss >= 0 &&
      (state.cursor > miss + 5 || state.cursor == state.text.length - 1)
    ) {
      results = wpm + " (errors must be corrected)";
    } else {
      results = wpm + " wpm";
    }
  } else {
    results = "[tab] to reset";
  }
  resultsSpan = h("span", { className: "results" }, results);
  return resultsSpan;
}

function renderWordsLinks(state) {
  return h(
    "span",
    ...[25, 50, 75, 100].flatMap((wc) => [
      h(
        "a",
        {
          href: `?wordCount=${wc}`,
          className: wc === state.wordCount ? "selected" : "",
        },
        wc
      ),
      " ",
    ])
  );
}

let cursorAtLastRender;

export function render(state, app) {
  app.firstChild.replaceWith(
    h(
      "div",
      h("p", renderText(state), renderResults(state)),
      h("footer", renderWordsLinks(state))
    )
  );
  cursorAtLastRender = state.cursor;
}

export function renderIncremental(state) {
  const [iMin, iMax] = [state.cursor, cursorAtLastRender].sort((a, b) => a - b);
  for (let i = iMin; i <= iMax && i < state.text.length; i++) {
    charSpans[i].className = charClassName(state, i);
  }
  resultsSpan.replaceWith(renderResults(state));
  cursorAtLastRender = state.cursor;
}
