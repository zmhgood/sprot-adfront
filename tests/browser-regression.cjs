const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const out = require('node:path').join(require('node:os').tmpdir(), 'sport-admin-regression')
fs.mkdirSync(out, {recursive:true})
const baseURL = process.env.ADMIN_QA_URL || 'http://127.0.0.1:3107'
if (!['127.0.0.1', 'localhost'].includes(new URL(baseURL).hostname)) throw new Error('Local admin only')
;(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'})
 const context=await browser.newContext({viewport:{width:1280,height:900}})
 const page=await context.newPage(),errors=[],checks=[];globalThis.qaPage=page
 page.on('pageerror',e=>errors.push(e.message))
 let failUsers=false,failComments=false,failModerate=false;let familyQuery=''
 await page.route('**/api/**',async route=>{
  const req=route.request(),u=new URL(req.url());if(!u.pathname.startsWith('/api/')){await route.continue();return};let data={};let code=0,status=200
  if(u.pathname==='/api/admin/info')data={id:701,username:'synthetic',nickname:'Synthetic admin'}
  else if(u.pathname==='/api/admin/users'){if(failUsers){status=500;code=500}else data={list:[{id:701,nick_name:'Synthetic user',gender:1}],total:1}}
  else if(u.pathname==='/api/admin/families'){familyQuery=u.searchParams.get('keyword');data={list:[{id:700,name:'Synthetic family',creator_id:701,creator:{nick_name:'Original creator'},members:[{user_id:704,role:'admin',user:{nick_name:'New admin'}}]}],total:1}}
  else if(u.pathname==='/api/admin/comments'){if(failComments){status=500;code=500}else data={list:[{id:705,content:'Synthetic comment',status:1,like_count:1,user:{nick_name:'Synthetic user'},exercise:{name:'Synthetic action'}}],total:1}}
  else if(u.pathname==='/api/admin/comments/705/status' && failModerate){status=500;code=500}
  else if(u.pathname==='/api/muscle-groups')data=[]
  else if(u.pathname==='/api/configs')data={site_name:'爸妈动起来'}
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify({code,message:code?'Synthetic request failure':'success',data})})
 })
 await page.addInitScript(()=>localStorage.setItem('admin_token','synthetic-test-only'))
 await page.goto(baseURL+'/users')
 await page.getByText('Synthetic user',{exact:true}).waitFor()
 assert.equal(await page.title(),'用户管理 - 管理后台');checks.push('users meaningful content and page identity')
 failUsers=true
 await page.getByRole('button',{name:'搜索',exact:true}).click()
 await page.getByText('用户加载失败，请重试',{exact:true}).waitFor()
 assert.equal(await page.getByText('张大爷',{exact:true}).count(),0);checks.push('user failure explicit, no invented rows')
 await page.screenshot({path:out+'/admin-users-error.png'})
 await page.goto(baseURL+'/families')
 await page.getByRole('cell',{name:'Original creator',exact:true}).waitFor();checks.push('creator distinct from current administrator')
 await page.getByPlaceholder('请输入家庭名称').fill('Synthetic search')
 await Promise.all([page.waitForResponse(r=>r.url().includes('/api/admin/families') && r.url().includes('Synthetic')),page.getByRole('button',{name:'搜索',exact:true}).click()])
 assert.equal(familyQuery,'Synthetic search');checks.push('family search sends keyword')
 await page.screenshot({path:out+'/admin-family-search.png'})
 await page.goto(baseURL+'/comments')
 await page.getByRole('cell',{name:'Synthetic comment',exact:true}).waitFor()
 failModerate=true
 await page.getByRole('button',{name:'隐藏',exact:true}).click()
 await page.getByRole('button',{name:'确定',exact:true}).click()
 await page.getByText('隐藏失败，请重试',{exact:true}).waitFor()
 assert.equal(await page.getByRole('button',{name:'隐藏',exact:true}).count(),1)
 assert.equal(await page.getByText('隐藏成功',{exact:true}).count(),0);checks.push('moderation failure preserves real status')
 failComments=true;await page.getByRole('button',{name:'搜索',exact:true}).click()
 await page.getByText('评论加载失败，请重试',{exact:true}).waitFor();checks.push('comment loading failure has no synthetic fallback')
 await page.setViewportSize({width:390,height:844}); await page.reload(); await page.getByText('评论加载失败，请重试',{exact:true}).waitFor(); assert(await page.locator('.el-aside').evaluate(el=>el.getBoundingClientRect().width)<100); assert(await page.locator('.logo-img').evaluate(el=>el.complete && el.naturalWidth>0)); checks.push('narrow layout collapses sidebar; logo loads with correct image type')
 await page.screenshot({path:out+'/admin-mobile-error.png'})
 assert.equal(await page.locator('vite-error-overlay').count(),0);assert.deepEqual(errors,[])
 checks.push('no runtime error or framework overlay; desktop and narrow viewport screenshots')
 fs.writeFileSync(out+'/admin-browser.json',JSON.stringify({url:baseURL,automation:'Playwright with synthetic API responses',data:'synthetic responses only',checks,errors},null,2))
 console.log('PASS',checks.length,'browser checks');await browser.close()
})().catch(async e=>{if(globalThis.qaPage){fs.writeFileSync(out+'/admin-debug.txt',await globalThis.qaPage.locator('body').innerText());await globalThis.qaPage.screenshot({path:out+'/admin-debug.png'})};console.error(e);process.exit(1)})
