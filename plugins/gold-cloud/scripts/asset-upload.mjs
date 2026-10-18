// Shared browser/connector transport only; asset validation remains on the original server.
export const ASSET_CHUNK_BYTES=4*1024*1024;
export const ASSET_JSON_MAX_BYTES=90*1024*1024;
function base64(bytes){if(typeof Buffer!=='undefined')return Buffer.from(bytes).toString('base64');let text='';for(let i=0;i<bytes.length;i+=32768)text+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(text);}
export async function uploadAsset(body,request){
 const json=JSON.stringify(body),bytes=new TextEncoder().encode(json);
 if(bytes.length<=8*1024*1024)return request('/api/assets',body);
 if(bytes.length>ASSET_JSON_MAX_BYTES)throw Error('素材请求超过90MiB；单个素材最多64MiB');
 const upload=await request('/api/asset-uploads/start',{bytes:bytes.length});
 try{
  for(let offset=0,index=0;offset<bytes.length;offset+=ASSET_CHUNK_BYTES,index++)await request('/api/asset-uploads/'+upload.id+'/chunk',{index,base64:base64(bytes.subarray(offset,offset+ASSET_CHUNK_BYTES))});
  return await request('/api/asset-uploads/'+upload.id+'/complete',{});
 }catch(error){await request('/api/asset-uploads/'+upload.id+'/cancel',{}).catch(()=>{});throw error;}
}

export function assetReceipt(r){return { assetId: r.id, name: r.name, type: r.type, usage: r.type === 'mesh' ? `{op:'body.set', args:{generator:'mesh', params:{assetId:'${r.id}', scale:1, rotate:[0,0,0]}}}` : r.type === 'svg' ? `{kind:'svg', width:8, svg:{assetId:'${r.id}'}}` : `{kind:'image', width:10, image:{assetId:'${r.id}', mode:'height'}, relief:{depth:0.45}} 或 body.outline {outline:{shape:'image', assetId:'${r.id}', w:20}}` };}
