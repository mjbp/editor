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
        browserToHTML : {
            'UL' : 'ul',
            'OL' : 'ol',
            'B' : 'bold',
            'I' : 'italic',
            'BLOCKQUOTE' : 'quote',
            'H1' : 'h1',
            'H2' : 'h2',
            'H3' : 'h3',
            'H4' : 'h4',
            'H5' : 'h5',
            'H6' : 'h6'
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
        toggleButtonState : function (button) {
            if (button.className.indexOf('active') > -1) {
                button.className = button.className.replace(/active/g, '')
                                             .replace(/\s{2}/g, ' ');
            } else {
                button.className += ' active';
            }
            return this;
        },
        bindUI : function () {
            var buttons = d.querySelectorAll('button'),
                i,
                self = this,
                buttonTrigger = function (e) {
                    var command = this.getAttribute('data-command');
                    e.preventDefault();
                    e.stopPropagation();
                    
                    //self.toggleButtonState(this)
                    self.executeStyle(command);
                };
            for (i = 0; i < buttons.length; i += 1) {
                toolkit.on(buttons[i], 'click', buttonTrigger);
            }
            return this;
        },
        executeStyle : function (c) {
            //test these commands
            var self = this,
                dispatchTable = {
                    'bold' : function () { d.execCommand('bold', false); },
                    'italic' : function () { d.execCommand('italic', false); },
                    'ul' : function () { dispatchTable.list('UL'); },
                    'ol' : function () { dispatchTable.list('OL'); },
                    'quote' : function () {
                        var parentNodes = self.findNodes(self.selection.focusNode);
                        
                        if (!!parentNodes.BLOCKQUOTE) {
                            self.removeNode(parentNodes.BLOCKQUOTE);
                        } else {
                            document.execCommand('formatBlock', false, 'blockquote');
                        }
                    },
                    'h1' : function () { dispatchTable.heading('H1'); },
                    'h2' : function () { dispatchTable.heading('H2'); },
                    'h3' : function () { dispatchTable.heading('H3'); },
                    'h4' : function () { dispatchTable.heading('H4'); },
                    'h5' : function () { dispatchTable.heading('H5'); },
                    'h6' : function () { dispatchTable.heading('H6'); },
                    'heading' : function (h) {
                        var parentNodes = self.findNodes(self.selection.focusNode);
                        
                        if (!!parentNodes[h]) {
                            d.execCommand('formatBlock', false, 'p');
                            d.execCommand('outdent');
                        } else {
                            d.execCommand('formatBlock', false, h);
                        }
                    },
                    'list' : function (l) {
                        var parentNodes = self.findNodes(self.selection.focusNode);
                        
                        if (!!parentNodes[l]) {
                            self.removeNode(parentNodes.LI);
                            self.removeNode(parentNodes.l);
                            d.execCommand('formatBlock', false, 'p');
                        } else {
                            d.execCommand('insertorderedlist', false);
                        }
                    }
                };
            dispatchTable[c]();
            
            //update UI button states
            this.updateUI();
            //reposition UI
            this.placeUI();
            
            return this;
        },
        removeNode : function (node) {
            var fragment = d.createDocumentFragment();
            
            while (node.firstChild) {
                fragment.appendChild(node.firstChild);
            }
            node.parentNode.replaceChild(fragment, node);
        },
        findNodes : function (element) {
            var nodeNames = {};
            
            //recursion through node parents
            //array of nodes hierachy indexed by nodeName
            while (element.parentNode) {
                nodeNames[element.nodeName] = element;
                element = element.parentNode;
            }
            return nodeNames;
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
                    
                    //SELECTION NEEDS REFINING??                
                    
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
                       //.initButtons()
                       .bindSelect()
                       .bindUI();
        }
    };
    
}(window, document));