import test from 'node:test';
import assert from 'node:assert/strict';
import {claimEnquiryWelcome,ENQUIRY_WELCOME_KEY} from '../lib/enquiry-welcome.mjs';
const storage=()=>{const data=new Map();return {getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};};

test('home enquiry appears once per tab session and remains dismissed on return visits',()=>{
 const session=storage();
 assert.equal(claimEnquiryWelcome(session),true);
 assert.equal(claimEnquiryWelcome(session),false);
 assert.equal(claimEnquiryWelcome(session),false);
 assert.equal(claimEnquiryWelcome(storage()),true);
});

test('opening an enquiry manually suppresses a duplicate automatic enquiry',()=>{
 const session=storage();session.setItem(ENQUIRY_WELCOME_KEY,'1');
 assert.equal(claimEnquiryWelcome(session),false);
});
