/*global window, document, console */
/*!
 *  @name   editor
 *  @date   Sept 2013
 *  @by     mjbp
 *  @todo   - add hr on double enter
            - fix list to blockquote on multi-li selection 
            - add link support
            - add configuration options (including color/bgColor of UI) / limit options on headers
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
        },/* next functions courtousy of Tim Down (stackoverflow.com/questions/2920150/insert-text-at-cursor-in-a-content-editable-div)*/
        saveSelection : function () {
            var i,
                len,
                ranges,
                sel = w.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                ranges = [];
                for (i = 0, len = sel.rangeCount; i < len; i += 1) {
                    ranges.push(sel.getRangeAt(i));
                }
                return ranges;
            }
            return null;
        },
        restoreSelection : function (savedSel) {
            var i,
                len,
                sel = window.getSelection();
            if (savedSel) {
                sel.removeAllRanges();
                for (i = 0, len = savedSel.length; i < len; i += 1) {
                    sel.addRange(savedSel[i]);
                }
            }
        },
        insertTextAtCaret : function (text) {
             var sel, range, html;
                if (window.getSelection) {
                    sel = window.getSelection();
                    if (sel.getRangeAt && sel.rangeCount) {
                        range = sel.getRangeAt(0);
                        range.deleteContents();
                        range.insertNode( document.createTextNode(text) );
                    }
                } else if (document.selection && document.selection.createRange) {
                    document.selection.createRange().text = text;
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
            /* remove all unwanted and empty nodes & attributes */
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
                //check if empty/whitespace-only and flag as unwanted
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
            //remove unwanted
            if (elsToRemove.length) {
                for (i = 0; i < elsToRemove.length; i += 1) {
                    self.removeNode(elsToRemove[i]);
                }
            }
            
            return self;
        },
        executeStyle : function (c) {
            var self = this,
                styleType,
                incompatibleElements = {
                    'UL' : ['BLOCKQUOTE', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'],
                    'OL' : ['BLOCKQUOTE', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'],
                    'BLOCKQUOTE' : ['LI', 'OL', 'UL'],
                    'heading' : ['BLOCKQUOTE', 'LI', 'OL', 'UL']
                },
                removeIncompatibles = function (p, a) {
                    var i,
                        l = a.length;
                    
                    for (i = 0; i < l; i += 1) {
                        if (!!p[a[i]]) {
                            self.removeNode(p[a[i]]);
                        }
                    }
                    return;
                },
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
                        var parentNodes = self.findParentNodes(self.selection.focusNode),
                            text,
                            incompatibles = incompatibleElements.heading;
                        
                        //remove elements we don't want mixing...
                        removeIncompatibles(parentNodes, incompatibles);
                        
                        if (!!parentNodes.BLOCKQUOTE) {
                            //is this next line needed under windows/chrome but not ubuntu? ;_;
                            //self.removeNode(parentNodes.BLOCKQUOTE);
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
                        var parentNodes = self.findParentNodes(self.selection.focusNode),
                            incompatibles = incompatibleElements.heading;
                        
                        //remove elements we don't want mixing...                        
                        removeIncompatibles(parentNodes, incompatibles);
                        
                        if (!!parentNodes[h]) {
                            d.execCommand('formatBlock', false, 'p');
                            d.execCommand('outdent');
                        } else {
                            d.execCommand('formatBlock', false, h);
                        }
                        
                        return;
                    },
                    'list' : function (listType) {
                        var parentNodes = self.findParentNodes(self.selection.focusNode),
                            updatedNodes,
                            incompatibles = incompatibleElements[listType];
                        
                        if (!!parentNodes[listType]) {
                            self.removeNode(parentNodes.LI);
                            self.removeNode(parentNodes[listType]);
                            d.execCommand('formatBlock', false, 'p');
                            d.execCommand('outdent');
                        } else {
                            //remove elements we don't want mixing...
                            removeIncompatibles(parentNodes, incompatibles);
                            
                            if (listType === 'UL') {
                                d.execCommand('insertunorderedlist', false);
                            } else {
                                d.execCommand('insertorderedlist', false);
                            }
                        }
                        return;
                    },
                    'hr' : function () {
                        //get caret position
                        //get contents of current node
                        //split into 2 nodes
                        //add hr element node between
                        //write page
                        //d.execCommand('insertHorizontalRule', false);
                        //d.execCommand("insertHtml", false, "<br>");
                    }
                };
            self.savedSelection = toolkit.saveSelection();
            toolkit.restoreSelection(self.savedSelection);
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
            node.parentNode.replaceChild(fragment, node);
            
            return;
        },
        findParentNodes : function (element) {
            var nodeNames = {};
            //recursion through node parents
            //array of nodes hierachy indexed by nodeName
            while (element.parentNode) {
                nodeNames[element.nodeName] = element;
                element = element.parentNode;
            }
            return nodeNames;
        },
        isList : function () {
            var parentNodes = this.findParentNodes(this.selection.focusNode);
            return parentNodes.LI;
        },
        enterHandler : function (e) {
            var self = this;
            
            if (!!self.isList()) {
                self.cleanUp();
            } else {
                e.preventDefault();
                self.returnCounter += 1;
                log(self.returnCounter);
                if (self.returnCounter === 2) {
                    self.returnCounter = 0;
                    self.executeStyle('hr');
                }
            }
            
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
                checkForHighlight = function (e) {
                    self.selection = w.getSelection();
                    self.liveElement = this;
                    
                    if (e.keyCode === 8 || e.keyCode === 46) {
                        self.cleanUp();
                    } else {
                        if (e.keyCode === 13) {
                            self.enterHandler(e);
                        }
                    }
                    
                    //selection business is buggy, sort it out you claaart
                    if (self.selection.isCollapsed === false) {
                        //show editor
                        self.showUI();
                    } else {
                        self.hideUI();
                    }
                };
            
            for (i = 0; i < l; i += 1) {
                toolkit.on(this.elements[i], 'mouseup', checkForHighlight);
                //toolkit.on(this.elements[i], 'keypress', function (e) {e.preventDefault(); });
                toolkit.on(this.elements[i], 'keyup', checkForHighlight);
            }
            return this;
        },
        init: function (selector, opts) {
            //extend defaults with options
            this.defaults = toolkit.extend(this.defaults, opts);
            
            //set elements based on selector
            this.elements = document.querySelectorAll(selector);
            if (this.elements.length === 0) {
                return;
            }
            this.returnCounter = 0;
            
            this.gui = d.getElementById('editor');
            return this.initEditableElements(selector)
                       //.initButtons()
                       .bindSelect()
                       .bindUI();
        }
    };
    
}(window, document));