/*global y*/
import {mxUtils, mxImage} from '../misc/mxExport.js';
import AbstractTag from './AbstractTag.js';
import CONST from '../misc/Constants.js';
import Y from 'yjs';

mxUtils.extend(IWCRespTag, AbstractTag);
AbstractTag.registerCodec(IWCRespTag);
IWCRespTag.Alias = CONST.TAG.ALIAS.IWC_RESP;
function IWCRespTag(cellId, offset){
    AbstractTag.call(this, cellId, new mxImage(CONST.IMAGES.IWC_RESP_TAG,CONST.TAG.SIZE-4, CONST.TAG.SIZE-4), 'IWC Response', offset);
    
    this.tagObj.setAttribute('_intentAction', '');
    this.tagObj.setAttribute('_content', '');
}
IWCRespTag.prototype.createShared = function (createdByLocalUser) {
    if (createdByLocalUser) {
        y.share.attrs.set(this.getId() + '_intentAction', Y.Text);
        y.share.attrs.set(this.getId() + '_content', Y.Text);

    }
}

IWCRespTag.prototype.initShared = function(){
    this.initYText('_intentAction');
    this.initYText('_content');
}
export default IWCRespTag;