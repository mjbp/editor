/*global window, document, console */
/*!
 *  @name   editor
 *  @date   Sept 2013
 *  @by     mjbp
 *  @todo   - fix all styles
            - add link support
            - add configuration options / limit options on headers
            - add p on enter (e.keyCode === 13)
            - delete p on delete/backspace
            - paste without styles (remove )
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
        cleanUp : function (styleType) {
            //needs attention
            /*
            the old way
            //check for and remove span, br, empty elements and inline styles in chrome ;_;
            var self = this,
                updatedNodes = self.findNodes(self.selection.focusNode),
                kids,
                i,
                l;
            
            if (!!updatedNodes.SPAN) {
                self.removeNode(updatedNodes.SPAN);
            }
            if (styleType === "inline") {
                kids = self.selection.focusNode.parentNode.childNodes;
            } else {
                kids = self.selection.focusNode.childNodes;
            }
            
            l = kids.length;
            for (i = 0; i < l; i += 1) {
                //here be dragons - remove inline style added by chrome
                if (kids[i].attributes) {
                    if (kids[i].attributes.style) {
                        kids[i].attributes.removeNamedItem('style');
                    }
                }
                if (kids[i].nodeName === 'SPAN' || kids[i].nodeName === 'BR') {
                    self.removeNode(kids[i]);
                } else {
                    //remove empty tags
                    if (/^\s*$/.test(kids[i].innerHTML)) {
                        self.removeNode(kids[i]);
                    }
                }
            }
            */
            
            /* remove all unwanted and empty nodes & attributes */
            /* new way */
            var self = this,
                child,
                disallowedEls = ['BR', 'SPAN'],
                disallowedAttrs = ['class', 'style'],
                children,
                elsToRemove = [],
                i, l, j, k;
            
            children = this.liveElement.getElementsByTagName('*');
            l = children.length;
            
            for (i = 0; i < l; i += 1) {
                child = children[i];
                
                 //remove unwanted attributes
                for (j = 0; j < disallowedAttrs.length; j += 1) {
                    if (child.hasAttribute(disallowedAttrs[j])) {
                        child.removeAttribute(disallowedAttrs[j]);
                    }
                }
                //check if empty/whitespace-only
                if (/^\s*$/.test(child.innerHTML)) {
                    elsToRemove.push(child);
                } else {
                    //flag unwanted nodes
                    for (k = 0; k < disallowedEls.length; k += 1) {
                        if (disallowedEls[k] === child.tagName) {
                            elsToRemove.push(child);
                        }
                    }
                }
            }
            //remove
            if (elsToRemove.length) {
                for (i = 0; i < elsToRemove.length; i += 1) {
                    self.removeNode(elsToRemove[i]);
                }
            }
            
            return self;
        },
        incompatibleElements : {
            'UL' : ['BLOCKQUOTE', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'],
            'OL' : ['BLOCKQUOTE', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'],
            'BLOCKQUOTE' : ['LI', 'OL', 'UL'],
            'heading' : ['BLOCKQUOTE', 'LI', 'OL', 'UL']
        },
        executeStyle : function (c) {
            var self = this,
                styleType,
                dispatchTable = {
                    'bold' : function () {
                        d.execCommand('bold', false);
                        return;
                    },
                    'italic' : function () {
                        d.execCommand('italic', false);
                        return;
                    },
                    'ul' : function () { dispatchTable.list('UL'); },
                    'ol' : function () { dispatchTable.list('OL'); },
                    'quote' : function () {
                        var parentNodes = self.findNodes(self.selection.focusNode),
                            text,
                            i,
                            incompatibles = self.incompatibleElements.heading,
                            l = incompatibles.length;
                        
                        //remove elements we don't want mixing...
                        for (i = 0; i < l; i += 1) {
                            if (!!parentNodes[incompatibles[i]]) {
                                self.removeNode(parentNodes[incompatibles[i]]);
                            }
                        }
                        if (!!parentNodes.BLOCKQUOTE) {
                            self.removeNode(parentNodes.BLOCKQUOTE);
                            d.execCommand('formatBlock', false, 'p');
			                d.execCommand('outdent');
                        } else {
                            d.execCommand('formatBlock', false, 'blockquote');
                        }
                        return;
                        
                        //mares - chrome removes p, 
                        //so either cannot support multi-line quotes or re-wrap in p
                    },
                    'h1' : function () { dispatchTable.heading('H1'); },
                    'h2' : function () { dispatchTable.heading('H2'); },
                    'h3' : function () { dispatchTable.heading('H3'); },
                    'h4' : function () { dispatchTable.heading('H4'); },
                    'h5' : function () { dispatchTable.heading('H5'); },
                    'h6' : function () { dispatchTable.heading('H6'); },
                    'heading' : function (h) {
                        var parentNodes = self.findNodes(self.selection.focusNode),
                            i,
                            incompatibles = self.incompatibleElements.heading,
                            l = incompatibles.length;
                        
                        //remove elements we don't want mixing...
                        //deja vu... refactor out
                        for (i = 0; i < l; i += 1) {
                            if (!!parentNodes[incompatibles[i]]) {
                                self.removeNode(parentNodes[incompatibles[i]]);
                            }
                        }
                        
                        if (!!parentNodes[h]) {
                            d.execCommand('formatBlock', false, 'p');
                            d.execCommand('outdent');
                        } else {
                            d.execCommand('formatBlock', false, h);
                        }
                        
                        return;
                    },
                    'list' : function (listType) {
                        var parentNodes = self.findNodes(self.selection.focusNode),
                            updatedNodes,
                            i,
                            incompatibles = self.incompatibleElements[listType],
                            l = incompatibles.length;
                        
                        if (!!parentNodes[listType]) {
                            self.removeNode(parentNodes.LI);
                            self.removeNode(parentNodes[listType]);
                            d.execCommand('formatBlock', false, 'p');
                            d.execCommand('outdent');
                        } else {
                            //remove elements we don't want mixing...
                            for (i = 0; i < l; i += 1) {
                                if (!!parentNodes[incompatibles[i]]) {
                                    self.removeNode(parentNodes[incompatibles[i]]);
                                }
                            }
                            if (listType === 'UL') {
                                d.execCommand('insertunorderedlist', false);
                            } else {
                                d.execCommand('insertorderedlist', false);
                            }
                        }
                        return;
                    }
                };
            dispatchTable[c]();
            self.cleanUp();
            
            //update UI button states
            //this.updateUI();
            //reselect if seleciton has failed (see adding list style)
            //reposition UI
            this.placeUI();
            
            return this;
        },
        removeNode : function (node) {
            var self = this,
                fragment = d.createDocumentFragment();
            
            while (node.firstChild) {
                //console.log(node.firstChild.parentElement);
                fragment.appendChild(node.firstChild);
            }
            console.log('boom:' + node + '> ' + node.parentNode);
            node.parentNode.replaceChild(fragment, node);
            
            return;
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
                    self.liveElement = this;
                    
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
            
            //log(this.elements);
            this.gui = d.getElementById('editor');
            return this.initEditableElements(selector)
                       //.initButtons()
                       .bindSelect()
                       .bindUI();
        }
    };
    
}(window, document));