export default {
  nodeSpec: {
    // discourse's [quote]
    quote: {
      content: "block+",
      group: "block",
      defining: true,
      inline: false,
      attrs: {
        username: {},
        postNumber: {},
        topicId: {},
        full: {},
      },
      parseDOM: [
        {
          tag: "aside.quote",
          getAttrs(dom) {
            return {
              username: dom.getAttribute("data-username"),
              postNumber: dom.getAttribute("data-post"),
              topicId: dom.getAttribute("data-topic"),
              full: dom.getAttribute("data-full"),
            };
          },
        },
      ],
      toDOM(node) {
        const { username, postNumber, topicId, full, displayName } = node.attrs;
        const attrs = { class: "quote" };
        attrs["data-username"] = username;
        attrs["data-post"] = postNumber;
        attrs["data-topic"] = topicId;
        attrs["data-full"] = full ? "true" : "false";

        // Render the quote node
        return [
          "aside",
          attrs,
          ["blockquote", 0],
          ["div", { class: "quote-header" }, displayName],
        ];
      },
    },
  },

  parse: {
    quote_header: { ignore: true },
    quote_controls: { ignore: true },
    bbcode(state, token) {
      if (token.tag === "aside") {
        state.openNode(state.schema.nodes.quote, {
          username: token.attrGet("data-username"),
          postNumber: token.attrGet("data-post"),
          topicId: token.attrGet("data-topic"),
          full: token.attrGet("data-full"),
        });
        return true;
      }

      if (token.tag === "blockquote") {
        state.openNode(state.schema.nodes.blockquote);
        return true;
      }
    },
  },
};
