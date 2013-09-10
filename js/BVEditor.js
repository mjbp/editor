/*global window, document */
/*!
 *  @name   editor
 *  @date   Sept 2013
 *  @by     mjbp
 */

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
                return a.forEach(callback);
            }
            for (i = 0; i < l; i += 1) {
                fn.call(a[i], i, a);
            }
        }
    };
    
    function BVEditor(selector, opts) {
        return this.init(selector, opts);
    }

    BVEditor.prototype = {
        defaults: {
            delay: 0
        },
        utils : {
            addEvent: function addEvent(element, eventName, func) {
                if (element.addEventListener) {
                    element.addEventListener(eventName, func, false);
                } else if (element.attachEvent) {
                    element.attachEvent("on" + eventName, func);
                }
            },
            removeEvent: function addEvent(element, eventName, func) {
                if (element.addEventListener) {
                    element.removeEventListener(eventName, func, false);
                } else if (element.attachEvent) {
                    element.detachEvent("on" + eventName, func);
                }
            }
        },
        checkSelection: function (e) {
            var newSelection;
            if (this.keepToolbarAlive !== true) {
                newSelection = window.getSelection();
                if (newSelection.toString().trim() === '') {
                    this.toolbar.style.display = 'none';
                } else {
                    this.selection = newSelection;
                    this.selectionRange = this.selection.getRangeAt(0);
                    this.toolbar.style.display = 'block';
                    this.setToolbarPosition()
                        .setToolbarButtonStates()
                        .showToolbarActions();
                }
            }
            return this;
        },
        initElements: function (selector) {
            var i;
            for (i = 0; i < this.elements.length; i += 1) {
                this.elements[i].setAttribute('contentEditable', true);
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
            return this.initElements(selector)
                       .initToolbar()
                       .bindSelect()
                       .bindButtons()
                       .bindAnchorForm()
                       .bindWindowActions();
            
            //init toolbar
            
            //bind button actions to methods
            //settimeout to check if 
        }
    };
    
}(window, document));