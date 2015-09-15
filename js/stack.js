// vim: set ts=2 sw=2 tw=99 et:
"use strict";

function Stack()
{
  this.impl = [];
}

Object.defineProperty(Stack.prototype, 'top', {
  get: function () {
    return this.impl[this.impl.length - 1];
  }
});
Object.defineProperty(Stack.prototype, 'empty', {
  get: function () {
    return this.impl.length == 0;
  }
});

Stack.prototype.pop = function () {
  return this.impl.pop();
}
Stack.prototype.push = function (value) {
  this.impl.push(value);
}
