export const OWNER = 'wcyhk';
export const CACHE_KEY = 'wcyhk-studio:latest-projects:v1';
export const CATALOG_CACHE_KEY = 'wcyhk-studio:public-projects:v2';
const excludedNames = new Set([OWNER.toLowerCase(), `${OWNER.toLowerCase()}.github.io`]);
export function selectPublicRepositories(repositories) {
 if (!Array.isArray(repositories)) throw new TypeError('Repository list must be an array');
 const unique = new Map();
 for (const repo of repositories) {
  if (!repo || typeof repo.name !== 'string' || !/^[A-Za-z0-9_.-]+$/.test(repo.name)) continue;
  if ((typeof repo.owner?.login !== 'string' || repo.owner.login.toLowerCase() !== OWNER.toLowerCase()) || repo.private || repo.fork || repo.disabled || repo.name.toLowerCase() === OWNER.toLowerCase()) continue;
  if (typeof repo.created_at !== 'string' || !Number.isFinite(Date.parse(repo.created_at))) continue;
  unique.set(repo.name.toLowerCase(), repo);
 }
 return [...unique.values()].sort((a,b) => Date.parse(b.created_at) - Date.parse(a.created_at) || a.name.localeCompare(b.name));
}
export function selectLatestRepositories(repositories) {
 return selectPublicRepositories(repositories).filter(repo=>!repo.archived && !excludedNames.has(repo.name.toLowerCase())).slice(0,3);
}
export function safeWebsite(value) {
 if (typeof value !== 'string' || !value.trim()) return null;
 try {const url = new URL(value);return ['https:','http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;} catch {return null;}
}
export function repositoryDestination(repo, knownProject) {
 const github = `https://github.com/${OWNER}/${encodeURIComponent(repo.name)}`;
 return safeWebsite(knownProject?.url) || safeWebsite(repo.homepage) || (repo.has_pages === true ? `https://wcy.hk/${encodeURIComponent(repo.name)}/` : github);
}
function snapshot(repo) {
 return {name:repo.name,created_at:repo.created_at,owner:{login:OWNER},homepage:safeWebsite(repo.homepage),has_pages:repo.has_pages === true,description:typeof repo.description==='string'?repo.description:null,language:typeof repo.language==='string'?repo.language:null,private:false,fork:false,archived:repo.archived===true,disabled:false};
}
export async function requestPublicRepositories({signal,fetcher=globalThis.fetch}={}) {
 let repositories = [];
 for (let page=1; page<=10; page++) {
  const url = `https://api.github.com/users/${OWNER}/repos?type=owner&sort=created&direction=desc&per_page=100&page=${page}`;
  const response = await fetcher(url,{headers:{Accept:'application/vnd.github+json'},cache:'no-store',signal});
  if (!response.ok) throw new Error(`GitHub request failed (${response.status})`);
  const batch = await response.json();
  if (!Array.isArray(batch)) throw new TypeError('Unexpected GitHub response');
  repositories.push(...batch);
  if (batch.length < 100) return selectPublicRepositories(repositories);
 }
 return selectPublicRepositories(repositories);
}
export async function requestLatestRepositories(options) {return selectLatestRepositories(await requestPublicRepositories(options));}
export function createLatestFeed({initialRepositories,render,storage,request=requestLatestRepositories,now=Date.now}) {
 let current = selectLatestRepositories(initialRepositories),inFlight=null,lastSuccess=0;
 try {
  const cached = JSON.parse(storage?.getItem(CACHE_KEY) || 'null');
  if (cached?.version===1 && Array.isArray(cached.repositories)) {
   const selected=selectLatestRepositories(cached.repositories);
   if (selected.length) current=selected;
  }
 } catch { /* Storage is optional. */ }
 render(current,{source:'saved'});
 return {
  get lastSuccess(){return lastSuccess;},
  refresh(){
   if (inFlight) return inFlight;
   inFlight=(async()=>{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
    try {
     const repositories=selectLatestRepositories(await request({signal:controller.signal}));
     current=repositories;lastSuccess=now();
     try {storage?.setItem(CACHE_KEY,JSON.stringify({version:1,repositories:repositories.map(snapshot)}));} catch { /* Private browsing or full storage. */ }
     render(current,{source:'live'});
     return {ok:true,repositories:current};
    } catch {
     render(current,{source:'saved'});
     return {ok:false,repositories:current};
    } finally {clearTimeout(timer);}
   })().finally(()=>{inFlight=null;});
   return inFlight;
  }
 };
}

export function createRepositoryFeed({initialRepositories,render,storage,request=requestPublicRepositories,now=Date.now}) {
 let current=selectPublicRepositories(initialRepositories),inFlight=null,lastSuccess=0;
 try {
  const cached=JSON.parse(storage?.getItem(CATALOG_CACHE_KEY)||'null');
  if(cached?.version===2 && Array.isArray(cached.repositories))current=selectPublicRepositories(cached.repositories);
 } catch {}
 render(current,{source:'saved'});
 return {
  get lastSuccess(){return lastSuccess;},
  refresh(){
   if(inFlight)return inFlight;
   inFlight=(async()=>{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
    try {
     current=selectPublicRepositories(await request({signal:controller.signal}));lastSuccess=now();
     try{storage?.setItem(CATALOG_CACHE_KEY,JSON.stringify({version:2,repositories:current.map(snapshot)}));}catch{}
     render(current,{source:'live'});return {ok:true,repositories:current};
    } catch {render(current,{source:'saved'});return {ok:false,repositories:current};}
    finally{clearTimeout(timer);}
   })().finally(()=>{inFlight=null;});return inFlight;
  }
 };
}
