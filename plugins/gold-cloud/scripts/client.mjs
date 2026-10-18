import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';

function assertPlatformDestination(url,header,platformToken){
  if(platformToken&&(header!=='x-gold-token'||url.protocol!=='https:'||url.port||!/^([a-z0-9-]+\.)+api-inference\.modelscope\.net$/.test(url.hostname)))throw Error('平台凭据仅允许发往确切 HTTPS *.api-inference.modelscope.net 地址，并使用独立 X-Gold Studio-Token');
}
export function remoteError(config,error){
  const message=String(error?.message||error);
  if(message.includes('服务器正在计算预览或编译交付'))return '云端正在生成预览或交付文件，请等待当前任务完成后再试。';
  if(/request limit exceeded|too many requests|HTTP 429/i.test(message))return '云端请求受到限流，来源待确认。请稍后再试，已有登录和工程仍然保留。';
  return [config.token,config.platformToken].filter(Boolean).reduce((text,secret)=>text.replaceAll(secret,'[REDACTED]'),message);
}
export function boundFetch(config,requestFetch=fetch){
  return (input,options={})=>{
    const url=new URL(typeof input==='object'&&'url' in input?input.url:String(input));
    if(url.origin!==config.origin)throw Error('远程请求不得离开已配置的精确服务 origin');
    assertPlatformDestination(url,config.tokenHeader||'authorization',config.platformToken);
    return config.requestGate?config.requestGate.fetch(input,{...options,redirect:'error'},requestFetch):requestFetch(input,{...options,redirect:'error'});
  };
}
export function connectionConfig(env = process.env) {
  if (!env.GOLD_REMOTE_ORIGIN || !env.GOLD_REMOTE_TOKEN) throw Error('请配置 GOLD_REMOTE_ORIGIN 和 GOLD_REMOTE_TOKEN。');
  const url = new URL(env.GOLD_REMOTE_ORIGIN);
  const local = ['127.0.0.1','localhost','[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw Error('服务地址必须是 HTTPS origin；本机测试可用回环 HTTP。');
  const tokenHeader=(env.GOLD_TOKEN_HEADER||'authorization').toLowerCase();
  if(!['authorization','x-gold-token'].includes(tokenHeader))throw Error('GOLD_TOKEN_HEADER 只支持 authorization 或 x-gold-token');
  const platformToken=env.GOLD_PLATFORM_TOKEN;
  assertPlatformDestination(url,tokenHeader,platformToken);
  return { origin:url.origin, token:env.GOLD_REMOTE_TOKEN, tokenHeader, platformToken,
    downloadDirectory:path.resolve(env.GOLD_DOWNLOAD_DIR || path.join(os.homedir(),'Downloads','Gold Studio')) };
}
export function credentialHeaders(config){
  const header=config.tokenHeader||'authorization';
  assertPlatformDestination(new URL(config.origin),header,config.platformToken);
  return {[header]:header==='authorization'?`Bearer ${config.token}`:config.token,...(config.platformToken?{Authorization:`Bearer ${config.platformToken}`}:{})};
}
export function createFileBridge(config, requestFetch = fetch) {
  const transport=boundFetch(config,requestFetch);
  async function request(route, options = {}) {
    const response = await transport(config.origin + route, { ...options, headers:{ ...options.headers, ...credentialHeaders(config) }, redirect:'error', signal:AbortSignal.timeout(130000) });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw Error(remoteError(config,body.error || `Gold Studio HTTP ${response.status}`));
    }
    return response;
  }
  return {
    async download({artifactId}) {
      if (!/^[A-Za-z0-9_-]{1,128}$/.test(artifactId)) throw Error('请输入 exports 返回的 artifactId。');
      const artifact = await (await request('/api/artifacts/'+artifactId+'/metadata')).json();
      if (!artifact||artifact.id!==artifactId||!Number.isInteger(artifact.bytes)||artifact.bytes<0||!/^[a-f0-9]{64}$/.test(artifact.sha256||'')) throw Error('交付元数据无效，未下载。');
      if (artifact.bytes > 64 * 1024 * 1024) throw Error('交付文件超过 64MB。');
      const response = await request('/api/artifacts/' + artifactId);
      const chunks = []; let size = 0;
      for await (const chunk of response.body) {
        size += chunk.length;
        if (size > 64 * 1024 * 1024) throw Error('交付文件超过 64MB。');
        chunks.push(chunk);
      }
      const bytes = Buffer.concat(chunks), sha256 = createHash('sha256').update(bytes).digest('hex');
      if (artifact.bytes !== size || (artifact.sha256 && artifact.sha256 !== sha256)) throw Error('交付文件大小或摘要不匹配，未保存。');
      const name = path.basename(artifact.name).replace(/[\\/:*?"<>|\x00-\x1f]/g, '-');
      if (!name || name === '.' || name === '..') throw Error('无效交付文件名。');
      const folder = path.join(config.downloadDirectory, artifactId);
      await fs.mkdir(folder,{recursive:true});
      const destination = path.join(folder,name);
      try { await fs.writeFile(destination, bytes, {flag:'wx'}); }
      catch (error) {
        if (error.code !== 'EEXIST') throw error;
        const existing = createHash('sha256').update(await fs.readFile(destination)).digest('hex');
        if (existing !== sha256) throw Error('本地已有不同内容的文件，未覆盖。');
      }
      return {ok:true,artifactId,name,path:destination,bytes:size,sha256};
    }
  };
}

export async function encodeLocalAsset(args){
 if(!args.path)return args;
 if(!path.isAbsolute(args.path)||!['image','mesh'].includes(args.kind)||args.base64)throw Error('请选择明确的本机图片或模型绝对路径，不同时指定base64');
 const extension=path.extname(args.path).toLowerCase();if(!(args.kind==='image'?['.png','.jpg','.jpeg','.webp']:['.stl','.obj']).includes(extension))throw Error('素材文件类型不支持');
 const file=await fs.open(args.path,'r');try{const stat=await file.stat();if(!stat.isFile()||stat.size>64*1024*1024)throw Error('素材必须是64MiB以内的普通文件');const bytes=await file.readFile();if(bytes.length>64*1024*1024)throw Error('素材超过64MiB');
  if(args.kind==='image'&&!((bytes[0]===137&&bytes.toString('ascii',1,4)==='PNG')||(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)||(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP')))throw Error('文件内容不是PNG/JPEG/WebP图片');
  if(args.kind==='mesh'&&extension==='.obj'&&!/(^|\n)v\s+[-+.0-9]/.test(bytes.toString('utf8')))throw Error('OBJ缺少顶点');
  if(args.kind==='mesh'&&extension==='.stl'&&!((bytes.length>=84&&84+bytes.readUInt32LE(80)*50===bytes.length)||/^\s*solid\s/.test(bytes.toString('utf8',0,200))))throw Error('STL内容无效');
  const {path:localPath,...rest}=args;return {...rest,base64:bytes.toString('base64'),...(args.kind==='mesh'?{format:extension.slice(1)}:{})};}finally{await file.close();}
}
