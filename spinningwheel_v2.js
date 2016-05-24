/**
 * 
 * Find more about the original version of Spinning Wheel function go to
 * http://cubiq.org/spinning-wheel-on-webkit-for-iphone-ipod-touch/11
 *
 * Copyright (c) 2016 Aleksandr Shevelev, http://alexalv.github.io/
 * Released under MIT license
 *  
 * Version 2.0alpha
 * 
 */

function SpinningWheel(data, options){
    
    var self = this;
    this.slotData = [];
    
    this.defaultOptions = {
        cellHeight: 44,
        friction: 0.003,
        mainElementId: 'sw-wrapper'
    };
    
    self.options = {};


    this.init = function() {

        for (var optionName in self.defaultOptions) {
            if (!options[optionName]) {
                self.options[optionName] = self.defaultOptions[optionName];
            } else {
                self.options[optionName] = options[optionName];
            }
        }
        
        self.reset();
        
        data.forEach(function(slotData){
            self.addSlot(slotData['data'],slotData['position'],slotData['defaultValue']);
        });   
        
        self.create();
    };
    
    /**
     *
     * Event handler
     *
     */

    this.handleEvent = function (e) {
        if (e.type == 'touchstart') {
            self.lockScreen(e);
            if (e.currentTarget.id == 'sw-cancel' || e.currentTarget.id == 'sw-done') {
                self.tapDown(e);
            } else if (e.currentTarget.id == 'sw-frame') {
                self.scrollStart(e);
            }
        } else if (e.type == 'touchmove') {
            self.lockScreen(e);
            if (e.currentTarget.id == 'sw-cancel' || e.currentTarget.id == 'sw-done') {
                self.tapCancel(e);
            } else if (e.currentTarget.id == 'sw-frame') {
                self.scrollMove(e);
            }
        } else if (e.type == 'touchend') {
            if (e.currentTarget.id == 'sw-cancel' || e.currentTarget.id == 'sw-done') {
                self.tapUp(e);
            } else if (e.currentTarget.id == 'sw-frame') {
                self.scrollEnd(e);
            }
        } else if (e.type == 'webkitTransitionEnd') {
            if (e.target.id == 'sw-wrapper') {
                self.destroy();
            } else {
                self.backWithinBoundaries(e);
            }
        } else if (e.type == 'orientationchange') {
            self.onOrientationChange(e);
        } else if (e.type == 'scroll') {
            self.onScroll(e);
        }
    };

    /**
     *
     * Global events
     *
     */

    this.onOrientationChange = function (e) {
        window.scrollTo(0, 0);
        //this.swWrapper.style.top = window.innerHeight + window.pageYOffset + 'px';
        this.calculateSlotsWidth();
    };
    
    this.onScroll = function (e) {
        //this.swWrapper.style.top = window.innerHeight + window.pageYOffset + 'px';
    };

    this.lockScreen = function (e) {
        e.preventDefault();
        e.stopPropagation();
    };

    /**
     *
     * Initialization
     *
     */

    this.reset = function () {
        self.slotEl = [];

        self.activeSlot = null;
        
        self.swWrapper = undefined;
        self.swSlotWrapper = undefined;
        self.swSlots = undefined;
        self.swFrame = undefined;
    };

    this.calculateSlotsWidth = function () {
        var div = self.swSlots.getElementsByTagName('div');
        for (var i = 0; i < div.length; i += 1) {
            self.slotEl[i].slotWidth = div[i].offsetWidth;
        }
    };

    this.create = function () {
        var i, l, out, ul, div;
        self.reset();   // Initialize object variables
        // Find the Spinning Wheel main wrapper
        div = document.getElementById(self.options.mainElementId);
        //div.style.top = window.innerHeight + window.pageYOffset + 'px';     // Place the SW down the actual viewing screen
        //div.style.webkitTransitionProperty = '-webkit-transform';
        div.innerHTML = '<div id="sw-slots-wrapper">'
                        +    '<div id="sw-slots">'
                        +    '</div>'
                        +'</div>'
                        +'<div id="sw-frame">'
                        +'</div>';

        //document.body.appendChild(div);

        self.swWrapper = div; // The SW wrapper
        self.swSlotWrapper = div.childNodes[0];       // Slots visible area
        self.swSlots = self.swSlotWrapper.childNodes[0];                     // Pseudo table element (inner wrapper)
        self.swFrame = div.childNodes[1];                     // The scrolling controller

        // Create HTML slot elements
        for (l = 0; l < self.slotData.length; l += 1) {
            // Create the slot
            ul = document.createElement('ul');
            out = '';
            for (i in self.slotData[l].values) {
                out += '<li>' + self.slotData[l].values[i] + '<' + '/li>';
            }
            ul.innerHTML = out;

            div = document.createElement('div');        // Create slot container
            div.className = self.slotData[l].style;     // Add styles to the container
            div.appendChild(ul);
    
            // Append the slot to the wrapper
            self.swSlots.appendChild(div);
            
            ul.slotPosition = l;            // Save the slot position inside the wrapper
            ul.slotYPosition = 0;
            ul.slotWidth = 0;
            ul.slotMaxScroll = self.swSlotWrapper.clientHeight - ul.clientHeight - 86;
            ul.style.webkitTransitionTimingFunction = 'cubic-bezier(0, 0, 0.2, 1)';     // Add default transition
            
            self.slotEl.push(ul);           // Save the slot for later use
            
            // Place the slot to its default position (if other than 0)
            if (self.slotData[l].defaultValue) {
                self.scrollToValue(l, self.slotData[l].defaultValue);   
            }
        }
        
        self.calculateSlotsWidth();
        
        // Global events
        //document.addEventListener('touchstart', self, false);           // Prevent page scrolling
        //document.addEventListener('touchmove', self, false);            // Prevent page scrolling
        //window.addEventListener('orientationchange', self, true);       // Optimize SW on orientation change
        //window.addEventListener('scroll', self, true);              // Reposition SW on page scroll

        // Add scrolling to the slots
        self.swFrame.addEventListener('touchstart', self, false);
    };

    /**
     *
     * Generic methods
     *
     */

    this.addSlot = function (values, style, defaultValue) {
        if (!style) {
            style = '';
        }
        
        style = style.split(' ');

        for (var i = 0; i < style.length; i += 1) {
            style[i] = 'sw-' + style[i];
        }
        
        style = style.join(' ');

        var obj = { 'values': values, 'style': style, 'defaultValue': defaultValue };
        self.slotData.push(obj);
    };

    this.getSelectedValues = function () {
        var index, count,
            i, l,
            keys = [], values = [];

        for (i in self.slotEl) {
            // Remove any residual animation
            self.slotEl[i].removeEventListener('webkitTransitionEnd', self, false);
            self.slotEl[i].style.webkitTransitionDuration = '0';

            if (self.slotEl[i].slotYPosition > 0) {
                self.setPosition(i, 0);
            } else if (self.slotEl[i].slotYPosition < self.slotEl[i].slotMaxScroll) {
                self.setPosition(i, self.slotEl[i].slotMaxScroll);
            }

            index = -Math.round(self.slotEl[i].slotYPosition / self.options.cellHeight);

            count = 0;
            for (l in self.slotData[i].values) {
                if (count == index) {
                    keys.push(l);
                    values.push(self.slotData[i].values[l]);
                    break;
                }
                
                count += 1;
            }
        }

        return { 'keys': keys, 'values': values };
    };


    /**
     *
     * Rolling slots
     *
     */

    this.setPosition = function (slot, pos) {
        self.slotEl[slot].slotYPosition = pos;
        self.slotEl[slot].style.webkitTransform = 'translate3d(0, ' + pos + 'px, 0)';
    };
    
    this.scrollStart = function (e) {
        // Find the clicked slot
        var xPos = e.targetTouches[0].clientX //- self.swSlots.offsetLeft;    // Clicked position minus left offset (should be 11px)

        // Find tapped slot
        var slot = 0;
        var el = self.swSlots;
        while (el) {
            slot += el.offsetLeft;
            el = el.offsetParent;
        }
        for (var i = 0; i < self.slotEl.length; i += 1) {
            slot += self.slotEl[i].slotWidth;
            
            if (xPos < slot) {
                self.activeSlot = i;
                break;
            }
        }

        // If slot is readonly do nothing
        if (self.slotData[self.activeSlot].style.match('readonly')) {
            self.swFrame.removeEventListener('touchmove', self, false);
            self.swFrame.removeEventListener('touchend', self, false);
            return false;
        }

        self.slotEl[self.activeSlot].removeEventListener('webkitTransitionEnd', self, false);   // Remove transition event (if any)
        self.slotEl[self.activeSlot].style.webkitTransitionDuration = '0';      // Remove any residual transition
        
        // Stop and hold slot position
        var theTransform = window.getComputedStyle(self.slotEl[self.activeSlot]).webkitTransform;
        theTransform = new WebKitCSSMatrix(theTransform).m42;
        if (theTransform != self.slotEl[self.activeSlot].slotYPosition) {
            self.setPosition(self.activeSlot, theTransform);
        }
        
        self.startY = e.targetTouches[0].clientY;
        self.scrollStartY = self.slotEl[self.activeSlot].slotYPosition;
        self.scrollStartTime = e.timeStamp;

        self.swFrame.addEventListener('touchmove', self, false);
        self.swFrame.addEventListener('touchend', self, false);
        
        return true;
    };

    this.scrollMove = function (e) {
        var topDelta = e.targetTouches[0].clientY - self.startY;

        if (self.slotEl[self.activeSlot].slotYPosition > 0 || self.slotEl[self.activeSlot].slotYPosition < self.slotEl[self.activeSlot].slotMaxScroll) {
            topDelta /= 2;
        }
        
        self.setPosition(self.activeSlot, self.slotEl[self.activeSlot].slotYPosition + topDelta);
        self.startY = e.targetTouches[0].clientY;

        // Prevent slingshot effect
        if (e.timeStamp - self.scrollStartTime > 80) {
            self.scrollStartY = self.slotEl[self.activeSlot].slotYPosition;
            self.scrollStartTime = e.timeStamp;
        }
        //self.getElementById('acslot').innerHTML = 'moving';
        //self.getElementById('newp').innerHTML = 'moving';
    };
    
    this.scrollEnd = function (e) {
        self.swFrame.removeEventListener('touchmove', self, false);
        self.swFrame.removeEventListener('touchend', self, false);

        // If we are outside of the boundaries, let's go back to the sheepfold
        if (self.slotEl[self.activeSlot].slotYPosition > 0 || self.slotEl[self.activeSlot].slotYPosition < self.slotEl[self.activeSlot].slotMaxScroll) {
            self.scrollTo(self.activeSlot, self.slotEl[self.activeSlot].slotYPosition > 0 ? 0 : self.slotEl[self.activeSlot].slotMaxScroll);
            return false;
        }

        // Lame formula to calculate a fake deceleration
        var scrollDistance = self.slotEl[self.activeSlot].slotYPosition - self.scrollStartY;

        // The drag session was too short
        if (scrollDistance < self.options.cellHeight / 1.5 && scrollDistance > -self.options.cellHeight / 1.5) {
            if (self.slotEl[self.activeSlot].slotYPosition % self.options.cellHeight) {
                self.scrollTo(self.activeSlot, Math.round(self.slotEl[self.activeSlot].slotYPosition / self.options.cellHeight) * self.options.cellHeight, '100ms');
            }

            return false;
        }

        var scrollDuration = e.timeStamp - self.scrollStartTime;

        var newDuration = (2 * scrollDistance / scrollDuration) / self.options.friction;
        var newScrollDistance = (self.options.friction / 2) * (newDuration * newDuration);
        
        if (newDuration < 0) {
            newDuration = -newDuration;
            newScrollDistance = -newScrollDistance;
        }
        
        var newPosition = self.slotEl[self.activeSlot].slotYPosition + newScrollDistance;

        if (newPosition > 0) {
            // Prevent the slot to be dragged outside the visible area (top margin)
            newPosition /= 2;
            newDuration /= 3;

            if (newPosition > self.swSlotWrapper.clientHeight / 4) {
                newPosition = self.swSlotWrapper.clientHeight / 4;
            }
        } else if (newPosition < self.slotEl[self.activeSlot].slotMaxScroll) {
            // Prevent the slot to be dragged outside the visible area (bottom margin)
            newPosition = (newPosition - self.slotEl[self.activeSlot].slotMaxScroll) / 2 + self.slotEl[self.activeSlot].slotMaxScroll;
            newDuration /= 3;
            
            if (newPosition < self.slotEl[self.activeSlot].slotMaxScroll - self.swSlotWrapper.clientHeight / 4) {
                newPosition = self.slotEl[self.activeSlot].slotMaxScroll - self.swSlotWrapper.clientHeight / 4;
            }
        } else {
            newPosition = Math.round(newPosition / self.options.cellHeight) * self.options.cellHeight;
        }

        self.scrollTo(self.activeSlot, Math.round(newPosition), Math.round(newDuration) + 'ms');
        return true;
    };

    this.scrollTo = function (slotNum, dest, runtime) {
        self.slotEl[slotNum].style.webkitTransitionDuration = runtime ? runtime : '100ms';
        self.setPosition(slotNum, dest ? dest : 0);

        // If we are outside of the boundaries go back to the sheepfold
        if (self.slotEl[slotNum].slotYPosition > 0 || self.slotEl[slotNum].slotYPosition < self.slotEl[slotNum].slotMaxScroll) {
            self.slotEl[slotNum].addEventListener('webkitTransitionEnd', self, false);
        }
    };
    
    this.scrollToValue = function (slot, value) {
        var yPos, count, i;

        self.slotEl[slot].removeEventListener('webkitTransitionEnd', self, false);
        self.slotEl[slot].style.webkitTransitionDuration = '0';
        
        count = 0;
        for (i in self.slotData[slot].values) {
            if (i == value) {
                yPos = count * self.options.cellHeight;
                self.setPosition(slot, yPos);
                break;
            }
            
            count -= 1;
        }
    };
    
    this.backWithinBoundaries = function (e) {
        e.target.removeEventListener('webkitTransitionEnd', self, false);

        self.scrollTo(e.target.slotPosition, e.target.slotYPosition > 0 ? 0 : e.target.slotMaxScroll, '150ms');
        return false;
    }
    
    this.init();

}