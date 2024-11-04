export default {
  nodeSpec: {
    hashtag: {
      attrs: { name: {} },
      inline: true,
      group: "inline",
      content: "text*",
      atom: true,
      draggable: true,
      selectable: false,
      parseDOM: [
        {
          tag: "a.hashtag-cooked",
          preserveWhitespace: "full",
          getAttrs: (dom) => {
            return { name: dom.getAttribute("data-name") };
          },
        },
      ],
      toDOM: (node) => {
        return [
          "a",
          { class: "hashtag-cooked", "data-name": node.attrs.name },
          `#${node.attrs.name}`,
        ];
      },
      leafText: (node) => `#${node.attrs.name}`,
    },
  },

  inputRules: [
    {
      match: /(?:^|\s)#(\w+) $/,
      handler: (state, match, start, end) =>
        state.tr.replaceWith(start, end, [
          state.schema.nodes.hashtag.create({ name: match[1] }),
          state.schema.text(" "),
        ]),
      options: { undoable: false },
    },
  ],

  parse: {
    span: (state, token, tokens, i) => {
      if (token.attrGet("class") === "hashtag-raw") {
        state.openNode(state.schema.nodes.hashtag, {
          name: tokens[i + 1].content.slice(1),
        });
        return true;
      }
    },
  },

  serializeNode: {
    hashtag: (state, node) => {
      state.write(`#${node.attrs.name}`);
    },
  },
};
