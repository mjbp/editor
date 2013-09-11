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
        }
    };
    

    Editor.prototype = {
        defaults: {
            delay: 0
        },
        showUI : function () {
            //this.gui.className = "text-options active";
            return this;
        },
        hideUI : function (self) {
            //this.gui.className = "text-options";
            return this;
        },
        utils : {/*
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
            }*/
        },
        initElements : function (selector) {
            var i;
            for (i = 0; i < this.elements.length; i += 1) {
                this.elements[i].setAttribute('contentEditable', true);
            }
            return this;
        },
        listen : function () {
            var self = this,
                i,
                l = this.elements.length,
                checkForHighlight = function () {
                    this.selection = w.getSelection();
                    if (this.selection.isCollapsed === false) {
                        //show editor
                        self.showUI();
                    } else {
                        self.ui.hideUI();
                    }
                };
            
            for (i = 0; i < l; i += 1) {
                this.elements[i].onmouseup = checkForHighlight;
                this.elements[i].onkeyup = checkForHighlight;
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
            return this.initElements(selector)
                       .listen();
            
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