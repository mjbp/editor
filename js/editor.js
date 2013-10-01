/*global window, document, console */
/*!
 *  @name   editor
 *  @date   Sept 2013
 *  @by     mjbp
 *  @todo   - fix list nightmares - enter and blockquote on multi-li selection
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
        },/* next functions courteousy of Tim Down, taken from Stack Overflow */
        saveSelection : function (containerEl) {
            var start,
                range = window.getSelection().getRangeAt(0),
                preSelectionRange = range.cloneRange();
            
            preSelectionRange.selectNodeContents(containerEl);
            preSelectionRange.setEnd(range.startContainer, range.startOffset);
            start = preSelectionRange.toString().length;

            return {
                start: start,
                end: start + range.toString().length
            };
        },
        restoreSelection : function (containerEl, savedSel) {
            var i,
                sel,
                charIndex = 0,
                range = document.createRange(),
                nodeStack = [containerEl],
                node,
                nextCharIndex,
                foundStart = false,
                stop = false;
            range.setStart(containerEl, 0);
            range.collapse(true);
            
    
            while (!stop && (node = nodeStack.pop())) {
                if (node.nodeType === 3) {
                    nextCharIndex = charIndex + node.length;
                    if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
                        range.setStart(node, savedSel.start - charIndex);
                        foundStart = true;
                    }
                    if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
                        range.setEnd(node, savedSel.end - charIndex);
                        stop = true;
                    }
                    charIndex = nextCharIndex;
                } else {
                    i = node.childNodes.length;
                    while (i--) {
                        nodeStack.push(node.childNodes[i]);
                    }
                }
            }
    
            sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        },
        insertTextAtCaret : function (text) {
            var sel, range, html;
            if (window.getSelection) {
                sel = window.getSelection();
                if (sel.getRangeAt && sel.rangeCount) {
                    range = sel.getRangeAt(0);
                    range.deleteContents();
                    range.insertNode(document.createTextNode(text));
                }
            } else if (document.selection && document.selection.createRange) {
                document.selection.createRange().text = text;
            }
        }
    };
    

    Editor.prototype = {
        defaults: {
            delay: 0,
            styles: ['b', 'i', 'ul', 'ol', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
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
        resetButtonState : function () {
            var i,
                buttons = this.gui.querySelectorAll('button'),
                l = buttons.length;
            
            for (i = 0; i < l; i += 1) {
                buttons[i].className = buttons[i].className.replace(/active/g, '').replace(/\s{2}/g, ' ');
            }
        },
        updateButtonState : function () {
            var i,
                button,
                parentNodes = this.findParentNodes(this.selection.anchorNode),
                l = parentNodes.length;
            
            this.resetButtonState();
            
            
            for (i in parentNodes) {
                if (parentNodes.hasOwnProperty(i)) {
                    button = d.getElementById('editor-' + i.toLowerCase());
                    if (button && button.className.indexOf('active') === -1) {
                        button.className = button.className + ' active';
                    }
                }
            }
        },
        bindUI : function () {
            var buttons = d.querySelectorAll('button'),
                i,
                self = this,
                buttonTrigger = function (e) {
                    var command = this.getAttribute('data-command');
                    e.preventDefault();
                    e.stopPropagation();
                    
                    self.executeStyle(command);
                };
            for (i = 0; i < buttons.length; i += 1) {
                toolkit.on(buttons[i], 'click', buttonTrigger);
            }
            return this;
        },
        cleanUp : function (styleType) {
            var i, l, j, k,
                self = this,
                child,
                frag,
                disallowedEls = ['BR', 'SPAN'],
                disallowedAttrs = ['class', 'style'],
                children,
                elsToFix = {remove : [], swap : []};
            
            children = this.liveElement.getElementsByTagName('*');
            l = children.length;
            
            for (i = 0; i < l; i += 1) {
                child = children[i];
                //log(child);
                child.normalize();
                
                 //remove unwanted attributes
                for (j = 0; j < disallowedAttrs.length; j += 1) {
                    if (child.hasAttribute(disallowedAttrs[j])) {
                        child.removeAttribute(disallowedAttrs[j]);
                    }
                }
                //check if empty/whitespace-only and flag as unwanted
                if (/^\s*$/.test(child.textContent) && child.nodeName !== 'HR') {
                    elsToFix.remove.push(child);
                } else {
                    //flag unwanted nodes
                    for (k = 0; k < disallowedEls.length; k += 1) {
                        if (disallowedEls[k] === child.tagName) {
                            elsToFix.remove.push(child);
                        }
                    }
                    //check for orphaned LIs
                    if (child.nodeName === 'LI' && (child.parentNode.nodeName !== 'UL' && child.parentNode.nodeName !== 'OL')) {
                        //log(child.parentNode);
                        elsToFix.swap.push(child);
                    }
                }
            }
            //remove unwanted
            if (elsToFix.remove.length) {
                for (i = 0; i < elsToFix.remove.length; i += 1) {
                    self.removeNode(elsToFix.remove[i]);
                }
            }
            if (elsToFix.swap.length) {
                for (i = 0; i < elsToFix.swap.length; i += 1) {
                    self.swapNode(elsToFix.swap[i]);
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
                        var parentNodes = self.findParentNodes(self.selection.anchorNode),
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
                    },
                    'h1' : function () { dispatchTable.heading('H1'); },
                    'h2' : function () { dispatchTable.heading('H2'); },
                    'h3' : function () { dispatchTable.heading('H3'); },
                    'h4' : function () { dispatchTable.heading('H4'); },
                    'h5' : function () { dispatchTable.heading('H5'); },
                    'h6' : function () { dispatchTable.heading('H6'); },
                    'heading' : function (h) {
                        var parentNodes = self.findParentNodes(self.selection.anchorNode),
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
                        var parentNodes = self.findParentNodes(self.selection.anchorNode),
                            updatedNodes,
                            startNode,
                            range,
                            frag,
                            endNode,
                            incompatibles = incompatibleElements[listType];
                        
                        //get outer node
                        //log(self.selection.anchorNode.parentNode);
                        //startNode
                        startNode = self.selection.anchorNode.parentNode;
                        //endNode
                        endNode = self.selection.focusNode.parentNode;
                        
                        //log('start :' + startNode);
                        //log('fin :' + endNode);
                        //log(endNode.textContent.length);
                        
                        //IF BUGS PERSIST:
                        //copy textContent start and end nodes
                        //remove LIs and UL/OL from parent and insertBefore the nodes in Ps
                        if (!!parentNodes[listType]) {
                            //self.removeNode(parentNodes.LI);
                            //self.removeNode(parentNodes[listType]);
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
                    }
                };
            self.savedSelection = toolkit.saveSelection(self.liveElement);
            toolkit.restoreSelection(self.liveElement, self.savedSelection);
            dispatchTable[c]();
            self.cleanUp();
            
            //update UI button states
            self.updateButtonState();
            //reselect if seleciton has failed (see adding list style)
            //reposition UI
            self.placeUI();
            
            return this;
        },
        removeNode : function (node) {
            var self = this,
                replacedChild,
                fragment = d.createDocumentFragment();
            
            while (node.firstChild) {
                //console.log(node.firstChild.parentElement);
                fragment.appendChild(node.firstChild);
            }
            replacedChild = node.parentNode.replaceChild(fragment, node);
            
            return replacedChild;
        },
        swapNode : function (node, type) {
            var fragment = d.createDocumentFragment(),
                replacement;
            type = type || 'p';
            replacement = d.createElement(type);
            while (node.firstChild) {
                fragment.appendChild(node.firstChild);
            }
            replacement.appendChild(fragment);
            node.parentNode.replaceChild(replacement, node);
            
            return;
        },
        findParentNodes : function (element) {
            var nodeNames = {};
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
            var self = this,
                range,
                rangeParent,
                previousNode,
                currentNode;
            
            if (!!self.isList()) {
                self.cleanUp();
            } else {
                range = self.selection.getRangeAt(0);
                previousNode = range.startContainer.parentNode.previousSibling;
                currentNode = range.startContainer.parentNode;
                if (range.startOffset === 0) {
                    e.preventDefault();
                    
                    if (range.startContainer.parentNode.nodeName === 'P' && range.startOffset === 0 && previousNode.nodeName !== 'HR') {
                        self.liveElement.insertBefore(d.createElement('hr'), range.startContainer.parentNode);
                    }
                    
                }
            }
            
        },
        backspaceHandler : function (e) {
            var previousNode, previousHTML, currentNode, currentHTML, replacement, savedSelection, replacementName,
                self = this,
                range = self.selection.getRangeAt(0);
            
            if (range.startOffset === 0) {
                previousNode = range.startContainer.parentNode.previousElementSibling;
                previousHTML = previousNode.innerHTML;
                currentNode = range.startContainer.parentNode;
                currentHTML = currentNode.innerHTML;
                replacementName = previousNode.nodeName === 'HR' ? 'p' : previousNode.nodeName.toLowerCase();
                
                replacement = d.createElement(replacementName);
                
                e.preventDefault();
                
                savedSelection = toolkit.saveSelection(previousNode);
                
                replacement.innerHTML = previousHTML + currentHTML;
                currentNode.parentNode.removeChild(currentNode);
                previousNode.parentNode.replaceChild(replacement, previousNode);
                
                /*
                self.selection.removeAllRanges();
                range = document.createRange();
                range.setStart(replacement, previousHTML.length / 2);
                //range.selectNode(replacement);
                range.collapse(true);
                self.selection.addRange(range);
                */
                toolkit.restoreSelection(replacement, savedSelection);
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
                keyDown = function (e) {
                    if (e.keyCode === 13) {
                        self.enterHandler(e);
                    } else {
                        if (e.keyCode === 8) {
                            self.backspaceHandler(e);
                        }
                    }
                },
                keyUp = function (e) {
                    if (e.keyCode === 8 || e.keyCode === 46) {
                        self.cleanUp();
                    }
                },
                checkForHighlight = function (e) {
                    self.selection = w.getSelection();
                    self.liveElement = this;
                    
                    //selection business is buggy, sort it out you claaart
                    if (self.selection.isCollapsed === false) {
                        //show editor
                        self.updateButtonState();
                        self.showUI();
                    } else {
                        self.hideUI();
                    }
                };
            
            for (i = 0; i < l; i += 1) {
                toolkit.on(this.elements[i], 'mouseup', checkForHighlight);
                toolkit.on(this.elements[i], 'keydown', keyDown);
                toolkit.on(this.elements[i], 'keyup', keyUp);
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
            
            this.gui = d.getElementById('editor');
            return this.initEditableElements(selector)
                       //.initButtons()
                       .bindSelect()
                       .bindUI();
        }
    };
    
}(window, document));