// TODO(renato): similar to emoji, avoid joining anything@mentions, as it's invalid markdown

export default {
  nodeSpec: {
    mention: {
      attrs: { name: {} },
      inline: true,
      group: "inline",
      content: "text*",
      atom: true,
      draggable: true,
      selectable: false,
      parseDOM: [
        {
          tag: "a.mention",
          preserveWhitespace: "full",
          getAttrs: (dom) => {
            return { name: dom.getAttribute("data-name") };
          },
        },
      ],
      toDOM: (node) => {
        return [
          "a",
          { class: "mention", "data-name": node.attrs.name },
          `@${node.attrs.name}`,
        ];
      },
      leafText: (node) => `@${node.attrs.name}`,
    },
  },

  inputRules: [
    {
      match: /(?:^|\s)@(\w+) $/,
      handler: (state, match, start, end) =>
        state.tr.replaceWith(
          start,
          end,
          state.schema.nodes.mention.create({ name: match[1] })
        ),
      options: { undoable: false },
    },
  ],

  parse: {
    mention: {
      block: "mention",
      getAttrs: (token, tokens, i) => ({
        // this is not ideal, but working around the mention_open/close structure
        // a text is expected just after the mention_open token
        name: tokens[i + 1].content.slice(1),
      }),
    },
  },

  serializeNode: {
    mention: (state, node) => {
      state.write(`@${node.attrs.name}`);
    },
  },
};
