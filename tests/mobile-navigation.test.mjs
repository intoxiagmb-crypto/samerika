import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const require=createRequire(import.meta.url);
function navigation(pathname,busy=false){
  const calls={prevented:0,pushes:[],events:[],scrolls:[]};
  const module={exports:{}};
  const source=ts.transpileModule(readFileSync(new URL('../components/mobile-navigation.tsx',import.meta.url),'utf8'),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true},
  }).outputText;
  const load=name=>name==='next/link'?{__esModule:true,default:'a'}:name==='next/navigation'?{usePathname:()=>pathname}:
    name==='lucide-react'?{}:require(name);
  const context={require:load,module,exports:module.exports,document:{querySelector:()=>busy?{}:null},
    PopStateEvent:class{constructor(type){this.type=type;}},window:{
      location:{assign(){throw new Error('Navigation must not reload the whole document.');}},
      history:{pushState:(state,title,url)=>calls.pushes.push(url)},dispatchEvent:event=>calls.events.push(event.type),scrollTo:options=>calls.scrolls.push(options),
    }};
  runInNewContext(source,context);
  const nav=module.exports.default({});
  return {calls,links:nav.props.children,click:href=>nav.props.children.find(link=>link.props.href===href).props.onClick({preventDefault:()=>calls.prevented++})};
}

test('APK navigation remains present on login, workspace, enquiry and shared quotes',()=>{
  for(const path of ['/','/login/company','/portal','/enquiry','/quotation/token']) {
    const {links}=navigation(path);
    assert.deepEqual(Array.from(links,link=>link.props.href),['/','/projects','/calculator','/contact','/portal']);
  }
});
test('profile resets the workspace without document reload; other routes use Link navigation',()=>{
  const {calls,click}=navigation('/portal');
  click('/portal');assert.deepEqual(calls.pushes,['/portal']);assert.deepEqual(calls.events,['popstate']);assert.equal(calls.prevented,1);
  click('/projects');assert.equal(calls.prevented,1);assert.equal(calls.pushes.length,1);
});
test('busy writes cannot be interrupted by bottom navigation',()=>{
  const {calls,click}=navigation('/portal',true);
  click('/portal');click('/');assert.equal(calls.prevented,2);assert.equal(calls.pushes.length,0);
});
