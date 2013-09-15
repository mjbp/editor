/*global window, document, console */
/*!
 *  @name   editor
 *  @date   Sept 2013
 *  @by     mjbp
 */

function log(w) {
    'use strict';
    console.log(w);
}
        
function Editor(selector, opts) {
    'use strict';
    
    return this.init(selector, opts);
}
(function (w, d) {
    'use strict';
    
    var toolkit = {
        extend: function (b, a) {
            var p;
            if (b === undefined) {
                return a;
            }
            for (p in a) {
                if (a.hasOwnProperty(p)) {
                    b[p] = a[p];
                }
            }
            return b;
        },
        forEach: function (a, fn) {
            var i, l = a.length;
            if ([].prototype.forEach) {
                return a.forEach(fn);
            }
            for (i = 0; i < l; i += 1) {
                fn.call(a[i], i, a);
            }
        },
        on : function (element, event, fn) {
            if (element.addEventListener) {
                element.addEventListener(event, fn, false);
            } else {
                element.attachEvent('on' + event, fn);
            }
        }
    };
    

    Editor.prototype = {
        defaults: {
            delay: 0
        },
        placeUI : function () {
            this.range = this.selection.getRangeAt(0);
            var boundary = this.range.getBoundingClientRect();
            
            this.gui.style.top = boundary.top - 48 + window.pageYOffset + "px";
            this.gui.style.left = boundary.left / 2 + "px";
            return this;
        },
        showUI : function () {
            this.placeUI()
                .gui.className = "active";
            return this;
        },
        hideUI : function (self) {
            this.gui.className = "";
            this.gui.style.top = "-100px";
            return this;
        },
        bindUI : function () {
            var buttons = d.querySelectorAll('button'),
                i,
                self = this,
                buttonTrigger = function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    /*
                    if (self.selection === undefined) {
                        //refactor
                        //self.checkSelection(e);
                    }
                    */
                    if (this.className.indexOf('active') > -1) {
                        this.className = this.className.replace(/active/g, '')
                                             .replace(/\s{2}/g, ' ');
                    } else {
                        this.className += ' active';
                    }
                    self.executeStyle(this.getAttribute('data-command'));
                };
            for (i = 0; i < buttons.length; i += 1) {
                toolkit.on(buttons[i], 'click', buttonTrigger);
            }
            return this;
        },
        executeStyle : function (c) {
            //test these commands
            var dispatchTable = {
                    'bold' : function () { document.execCommand('bold', false); },
                    'italic' : function () { document.execCommand('italic', false); },
                    'ul' : function () { document.execCommand('insertunorderedlist', false); },
                    'ol' : function () { document.execCommand('insertorderedlist', false); },
                    'quote' : function () { document.execCommand('formatBlock', false, 'blockquote'); },
                    'h1' : function () { document.execCommand('formatBlock', false, 'H1'); },
                    'h2' : function () { document.execCommand('formatBlock', false, 'H2'); },
                    'h3' : function () { document.execCommand('formatBlock', false, 'H3'); },
                    'h4' : function () { document.execCommand('formatBlock', false, 'H4'); },
                    'h5' : function () { document.execCommand('formatBlock', false, 'H5'); },
                    'h6' : function () { document.execCommand('formatBlock', false, 'H6'); }
                };
            log(c);
            dispatchTable[c]();
            
            return this;
        },
        initEditableElements : function (selector) {
            var i,
                l = this.elements.length;
            for (i = 0; i < l; i += 1) {
                this.elements[i].setAttribute('contentEditable', true);
            }
            return this;
        },
        bindSelect : function () {
            var self = this,
                i,
                l = this.elements.length,
                checkForHighlight = function () {
                    self.selection = w.getSelection();
                    if (self.selection.isCollapsed === false) {
                        //show editor
                        self.showUI();
                    } else {
                        self.hideUI();
                    }
                };
            
            for (i = 0; i < l; i += 1) {
                toolkit.on(this.elements[i], 'mouseup', checkForHighlight);
                toolkit.on(this.elements[i], 'keyup', checkForHighlight);
            }
            return this;
        },
        init: function (selector, opts) {
            //extend defaults with options
            this.defaults = toolkit.extend(this.defaults, opts);
            //this.ui = this.ui;
            
            log('initialised');
            //set elements based on selector
            this.elements = document.querySelectorAll(selector);
            if (this.elements.length === 0) {
                return;
            }
            
            log(this.elements);
            this.gui = d.getElementById('editor');
            return this.initEditableElements(selector)
                       .bindSelect()
                       .bindUI();
            
            /*
            return this.initElements(selector)
                       .initToolbar()
                       .bindSelect()
                       .bindButtons()
                       .bindAnchorForm()
                       .bindWindowActions();
                       */
            
            //init toolbar and bind button actions to methods
            
            // check if text has been selected
            
            
            
        }
    };
    
}(window, document));