import {selectPublicRepositories,selectLatestRepositories,repositoryDestination} from './latest-projects.js';
export function buildCatalog(repositories,curatedProjects){
 const curatedByRepo=new Map(curatedProjects.map(p=>[p.repo.toLowerCase(),p]));
 return selectPublicRepositories(repositories).map(repo=>{
  const known=curatedByRepo.get(repo.name.toLowerCase());
  if(known)return {...known,createdAt:repo.created_at,autoDiscovered:false};
  const language=typeof repo.language==='string'?repo.language:null;
  return {
   id:`github-${repo.name.toLowerCase()}`,repo:repo.name,title:repo.name.replace(/[-_]+/g,' '),english:repo.name.replace(/[-_]+/g,' ').toUpperCase(),
   category:'new',categoryName:language?`新上架 × ${language}`:'新上架 × 探索',label:'新上架 · 共用封面',tagline:'下一個想像，現在開始。',
   description:typeof repo.description==='string' && repo.description.trim()?repo.description:'新作品已加入 WCY.HK STUDIO 的創作宇宙。前往專案頁查看使用方式、功能與最新進展。',
   features:[language?`主要程式語言：${language}`:'查看專案說明與使用方式',repo.has_pages?'設有 GitHub Pages 網站':'前往作品入口了解更多'],
   url:repositoryDestination(repo),github:`https://github.com/wcyhk/${encodeURIComponent(repo.name)}`,video:null,image:'assets/gateway.webp',accent:'#b9bcf0',
   note:'新作品已自動收錄，暫用工作室共用概念封面；專屬海報及示範影片尚待補充。請前往作品入口查看實際內容。',
   createdAt:repo.created_at,autoDiscovered:true
  };
 }).sort((a,b)=>Number(a.category==='gateway')-Number(b.category==='gateway')||Date.parse(b.createdAt)-Date.parse(a.createdAt))
 .map((p,index)=>({...p,number:String(index+1).padStart(2,'0')}));
}
export function countCategories(catalog){
 return catalog.reduce((counts,p)=>({...counts,[p.category]:(counts[p.category]||0)+1,all:counts.all+1}),{all:0});
}

export function selectSpotlightProjectIds(repositories,catalog){
 const byRepo=new Map(catalog.map(p=>[p.repo.toLowerCase(),p.id]));
 return selectLatestRepositories(repositories).map(repo=>byRepo.get(repo.name.toLowerCase())).filter(Boolean);
}
