/*global y*/
import UIText from './UIText.js';
import $ from 'jquery';
import {
    mxGeometry
} from '../misc/mxExport.js';

RadioButton.prototype = new UIText();
RadioButton.prototype.constructor = RadioButton;
UIText.registerCodec(RadioButton);
//Global for the codec converter
window.RadioButton = RadioButton;

function RadioButton(geometry) {
    var text = 'Option';
    if (!geometry)
        geometry = new mxGeometry(0, 0, 150, 30);
    UIText.call(this, text, geometry);
    this.value.setAttribute('_checked', false);
    this.value.setAttribute('_autofocus', false);
    this.value.setAttribute('_disabled', false);

    this.initDOM = function () {
        this.set$node
            ($('<div>')
                .append($('<input>').attr('type', 'radio').attr('checked', true))
                .append($('<input>').attr('type', 'input')
                    .css('font-size', 15)
                    .css('width', this.geometry.width - 30)
                    .css('height', this.geometry.height - 10)
                    .css('background-color', 'transparent')
                    .css('border-style', 'initial')
                    .val(text)));
    }
    return this;
}
RadioButton.prototype.bindLabel = function (ytext) {
    ytext.bind(this.get$node().find('input[type="input"]')[0]);
}

RadioButton.prototype.initShared = function () {
    UIText.prototype.initShared.call(this);
    var val = y.share.attrs.get(this.getId() + '_checked');
    if (val)
        this.setBooleanAttributeValue('_checked', val);
    val = y.share.attrs.get(this.getId() + '_autofocus');
    if (val)
        this.setBooleanAttributeValue('_autofocus', val);
    val = y.share.attrs.get(this.getId() + '_disabled');
    if (val)
        this.setBooleanAttributeValue('_disabled', val);
}
export default RadioButton;