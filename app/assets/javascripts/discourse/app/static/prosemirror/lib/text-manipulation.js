import { setOwner } from "@ember/owner";
import $ from "jquery";
import { setBlockType, toggleMark, wrapIn } from "prosemirror-commands";
import { TextSelection } from "prosemirror-state";
import { convertFromMarkdown } from "discourse/static/prosemirror/lib/parser";
import { bind } from "discourse-common/utils/decorators";
import { i18n } from "discourse-i18n";

const PLACEHOLDER_IMG = "/images/transparent.png";

export default class TextManipulation {
  markdownOptions;
  /** @type {import("prosemirror-model").Schema} */
  schema;
  /** @type {import("prosemirror-view").EditorView} */
  view;
  $editorElement;
  placeholder;
  autocompleteHandler;

  constructor(owner, { markdownOptions, schema, view }) {
    setOwner(this, owner);
    this.markdownOptions = markdownOptions;
    this.schema = schema;
    this.view = view;
    this.$editorElement = $(view.dom);

    this.placeholder = new PlaceholderHandler({ schema, view });
    this.autocompleteHandler = new AutocompleteHandler({ schema, view });
  }

  /**
   * The textual value of the selected text block
   * @returns {string}
   */
  get value() {
    const parent = this.view.state.selection.$head.parent;

    return parent.textBetween(0, parent.nodeSize - 2, " ", " ");
  }

  getSelected(trimLeading, opts) {
    const start = this.view.state.selection.from;
    const end = this.view.state.selection.to;
    const text = this.view.state.doc.textBetween(start, end, " ", " ");
    const trimmed = text.trim();
    const leading = text.slice(0, trimmed.length - text.length);
    const trailing = text.slice(trimmed.length);
    const sel = { start, end, text, trimmed, leading, trailing };

    if (trimLeading) {
      sel.text = trimmed;
      sel.start += leading.length;
    }

    return sel;
  }

  focus() {
    this.view.focus();

    const isAllSelected =
      this.view.state.selection.$from.pos === 0 &&
      this.view.state.selection.$to.pos === this.view.state.doc.nodeSize - 2;
    if (isAllSelected) {
      // TODO this is very hacky, we should be able to get rid of this!
      setTimeout(() => {
        this.view.dispatch(
          this.view.state.tr.setSelection(
            TextSelection.create(this.view.state.doc, 0)
          )
        );
      }, 0);
    }
  }

  blurAndFocus() {
    this.focus();
  }

  putCursorAtEnd() {
    // this.view.dispatch(
    //   this.view.state.tr.setSelection(
    //     TextSelection.create(this.view.state.doc, 0)
    //   )
    // );
  }

  autocomplete(options) {
    return this.$editorElement.autocomplete(
      options instanceof Object
        ? { textHandler: this.autocompleteHandler, ...options }
        : options
    );
  }

  applySurroundSelection(head, tail, exampleKey, opts) {
    this.applySurround(this.getSelected(), head, tail, exampleKey, opts);
  }

  applySurround(sel, head, tail, exampleKey, opts) {
    const applySurroundMap = {
      italic_text: this.schema.marks.em,
      bold_text: this.schema.marks.strong,
      code_title: this.schema.marks.code,
    };

    if (applySurroundMap[exampleKey]) {
      toggleMark(applySurroundMap[exampleKey])(
        this.view.state,
        this.view.dispatch
      );

      return;
    }

    // TODO other cases, probably through md parser
  }

  async addText(sel, text, options) {
    const doc = await convertFromMarkdown(
      this.schema,
      text,
      this.markdownOptions
    );

    // assumes it returns a single block node
    const content = doc.content.firstChild.content;

    this.view.dispatch(
      this.view.state.tr.replaceWith(sel.start, sel.end, content)
    );
  }

  applyList(_selection, head, exampleKey, opts) {
    // This is similar to applySurround, but doing it line by line
    // We may use markdown parsing as a fallback if we don't identify the exampleKey
    // similarly to applySurround
    // TODO to check actual applyList uses in the wild

    // const selection = this.view.state.selection;

    let command;

    if (exampleKey === "list_item") {
      if (head === "* ") {
        command = wrapIn(this.schema.nodes.bullet_list);
      } else {
        command = wrapIn(this.schema.nodes.ordered_list);
      }
    } else {
      const applyListMap = {
        blockquote_text: this.schema.nodes.blockquote,
      };

      if (applyListMap[exampleKey]) {
        // TODO toggle
        // if (selection.$head.parent.type === applyListMap[exampleKey]) {
        //   command = setBlockType(this.schema.nodes.paragraph);
        // } else {
        command = wrapIn(applyListMap[exampleKey]);
        // }
      }
    }

    command?.(this.view.state, this.view.dispatch);
  }

  formatCode() {
    let command;

    const selection = this.view.state.selection;

    if (selection.$from.parent.type === this.schema.nodes.code_block) {
      command = setBlockType(this.schema.nodes.paragraph);
    } else if (
      selection.$from.pos !== selection.$to.pos &&
      selection.$from.parent === selection.$to.parent
    ) {
      command = toggleMark(this.schema.marks.code);
    } else {
      command = setBlockType(this.schema.nodes.code_block);
    }

    command?.(this.view.state, this.view.dispatch);
  }

  @bind
  emojiSelected(code) {
    const text = this.value.slice(0, this.getCaretPosition());
    const captures = text.match(/\B:(\w*)$/);

    if (!captures) {
      if (text.match(/\S$/)) {
        this.view.dispatch(
          this.view.state.tr
            .insertText(" ", this.view.state.selection.from)
            .replaceSelectionWith(this.schema.nodes.emoji.create({ code }))
        );
      } else {
        this.view.dispatch(
          this.view.state.tr.replaceSelectionWith(
            this.schema.nodes.emoji.create({ code })
          )
        );
      }
    } else {
      let numOfRemovedChars = captures[1].length;
      this.view.dispatch(
        this.view.state.tr
          .delete(
            this.view.state.selection.from - numOfRemovedChars - 1,
            this.view.state.selection.from
          )
          .replaceSelectionWith(this.schema.nodes.emoji.create({ code }))
      );
    }
    this.focus();
  }

  @bind
  paste(e) {
    // TODO
    console.log("paste");
    // let { clipboard, canPasteHtml, canUpload } = clipboardHelpers(e, {
    //   siteSettings: this.siteSettings,
    //   canUpload: true,
    // });

    // console.log(clipboard);

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }

  selectText() {
    // TODO
  }

  @bind
  inCodeBlock() {
    return (
      this.view.state.selection.$from.parent.type ===
      this.schema.nodes.code_block
    );
  }

  /**
   * Gets the textual caret position within the selected text block
   *
   * @returns {number}
   */
  getCaretPosition() {
    const { $anchor } = this.view.state.selection;

    return $anchor.pos - $anchor.start();
  }
}

class AutocompleteHandler {
  /** @type {import("prosemirror-view").EditorView} */
  view;
  /** @type {import("prosemirror-model").Schema} */
  schema;

  constructor({ schema, view }) {
    this.schema = schema;
    this.view = view;
  }

  /**
   * The textual value of the selected text block
   * @returns {string}
   */
  get value() {
    return this.view.state.selection.$head.nodeBefore?.textContent ?? "";
  }

  /**
   * Replaces the term between start-end in the currently selected text block
   *
   * It uses input rules to convert it to a node if possible
   *
   * @param {number} start
   * @param {number} end
   * @param {String} term
   */
  replaceTerm({ start, end, term }) {
    const node = this.view.state.selection.$head.nodeBefore;
    const from = this.view.state.selection.from - node.nodeSize + start;
    const to = this.view.state.selection.from - node.nodeSize + end + 1;

    // There must be an input rule matching the autocomplete term to convert to a node
    // TODO(renato): it's more expensive, but maybe just parsing it as markdown works better
    let replaced;
    for (const plugin of this.view.state.plugins) {
      if (plugin.spec.isInputRules) {
        replaced ||= plugin.props.handleTextInput(
          this.view,
          from,
          to,
          term,
          null
        );
      }
    }

    if (!replaced) {
      this.view.dispatch(
        this.view.state.tr.replaceWith(from, to, this.schema.text(term))
      );
    }
  }

  /**
   * Gets the textual caret position within the selected text block
   *
   * @returns {number}
   */
  getCaretPosition() {
    const node = this.view.state.selection.$head.nodeBefore;

    if (!node?.isText) {
      return 0;
    }

    return node.nodeSize;
  }

  /**
   * Gets the caret coordinates within the selected text block
   *
   * @param {number} start
   *
   * @returns {{top: number, left: number}}
   */
  getCaretCoords(start) {
    const node = this.view.state.selection.$head.nodeBefore;
    const pos = this.view.state.selection.from - node.nodeSize + start;
    const { left, top } = this.view.coordsAtPos(pos);

    const rootRect = this.view.dom.getBoundingClientRect();

    return {
      left: left - rootRect.left,
      top: top - rootRect.top,
    };
  }

  inCodeBlock() {
    // TODO
    return false;
  }
}

// TODO(renato): https://prosemirror.net/examples/upload/
class PlaceholderHandler {
  view;
  schema;

  constructor({ schema, view }) {
    this.schema = schema;
    this.view = view;
  }

  insert(file) {
    // insert placeholder file
    this.view.dispatch(
      this.view.state.tr.insert(
        this.view.state.selection.from,
        this.schema.nodes.image.create({
          src: PLACEHOLDER_IMG,
          alt: i18n("uploading_filename", { filename: "asd" }),
          title: file.id,
        })
      )
    );
  }

  progress(file) {
    console.log("progress", file);
  }

  progressComplete(file) {
    console.log("progressComplete", file);
  }

  cancelAll() {
    // remove all placeholders
  }

  cancel(file) {
    // remove placeholder file
  }

  async success(file, markdown) {
    let nodeToReplace = null;
    this.view.state.doc.descendants((node, pos) => {
      if (node.attrs?.title === file.id) {
        nodeToReplace = { node, pos };
        return false;
      }
      return true;
    });

    const doc = await convertFromMarkdown(this.schema, markdown);

    this.view.dispatch(
      this.view.state.tr.replaceWith(
        nodeToReplace.pos,
        nodeToReplace.pos + nodeToReplace.node.nodeSize,
        doc.content.firstChild.content
      )
    );
  }
}
