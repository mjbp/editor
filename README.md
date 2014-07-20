#editor
A basic inline HTML editor based on the [medium.com] (medium.com) authoring experience.

Demo: [http://mjbp.github.io/editor] (http://mjbp.github.io/editor)

##Features
Adds contentEditability on the fly

###HTML and Styles
- Bold, italic, blockquote, h1-h6, and link in pop-up editor menu
- Ordered list when hit enter on a line starting '1.'
- Unordered list when hit enter on a line starting '- '
- Horizontal rule when hit enter twice on new line

###Headers
Treat headers differently to article body text - add editability but not the toolbar

###Placeholders
Supports placeholder text for editable elements

##Usage
Include editor.js and style.css

Instantiate a new Editor object passing css selector (those supported by document.querySelectorAll())

```javascript
var editor = new Editor('.editable');</script>

In this example all elements with the className 'editable' will be rendered contentEditable and the toolbar enabled.

###Options
Add editability but not the toolbar by adding 'editor-heading' class to an element:

```html
    <header class="editable editor-heading"></header>
```

Set the HTML and style formatting you would like (the buttons shown on the toolbar) to use by passing them to the editor constructor:

```javascript
    var editor = new Editor('.editable', {
            buttons: ['b', 'i', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'cancel']
        });
```

##Browser support
Developed and tested in latest builds of Chrome and Firefox.


##Credits
Obvious Corp's medium.com, tholman's [http://zenpen.io] (http://zenpen.io)

