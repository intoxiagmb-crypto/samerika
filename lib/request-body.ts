export async function readLimitedBody(request:Request,maxBytes:number):Promise<Uint8Array>{
 if(Number(request.headers.get('content-length')||0)>maxBytes)throw Object.assign(new Error('Request is too large.'),{status:413});
 const reader=request.body?.getReader();if(!reader)return new Uint8Array();const chunks:Uint8Array[]=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes){await reader.cancel();throw Object.assign(new Error('Request is too large.'),{status:413});}chunks.push(value);}
 const body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.byteLength;}return body;
}
