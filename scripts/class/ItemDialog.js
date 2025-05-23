import CharRoll from './CharRoll.js';
import * as gb from './../gb.js';
import ItemRoll from './ItemRoll.js';
import Char from './Char.js';

export default class ItemDialog {
    constructor(actor,itemId){
        this.item=actor.items.get(itemId);
     //   this.vehicle=false;
       

        if (actor.type=='vehicle'){
            this.vehicle=actor;
           // console.log(this.vehicle);
            actor=gb.getDriver(actor);
         //   console.log(actor);
        }

        this.actor=actor;
        this.charRoll=new CharRoll(actor);

        this.dontDisplay=false;
    }

    

    saveSkill(newSkill){
        this.item.update({'system.actions.trait':newSkill});
        this.item.system.actions.trait=newSkill;
        this.dontDisplay=false;
        this.showDialog();
    }

    noSkillItem(){
        
        let item=this.item;  
        
        if (!item.system?.innate && item.type!='action'){
        
        let content=`<p><strong>${this.item.name}</strong> ${gb.trans('NoSkillQuestion')}</p>`;
        content+=`<p><select id="skillitem">`;
        this.actor.items.filter(el=>el.type=='skill').map(skill=>{
            content+=`<option value="${skill.name}">${skill.name}</option>`;
        })

        content+=`<optgroup label="${gb.trans('Attributes','SWADE')}">`;
        gb.attributesShort.map(attr=>{
            content+=`<option value="${attr.trans}">${attr.trans}</option>`
        })
        content+=`</optgroup>`

        content+=`</select></p>`;

        new Dialog({
            title: item.name,
            content: content,
            buttons: {
                no: {
                    label: `<i class="fas fa-times"></i> ${gb.trans('LeaveItBlank')}`,
                    callback: async ()=>{
                        await item.setFlag('swade-tools','skillitem',true);
                        this.dontDisplay=false;
                        this.showDialog();
                        
                    }
                },/* 
                cancel: {
                    label: `<i class="fas fa-times"></i> ${gb.trans('Unskilled')}`,
                    callback: ()=>{
                        this.saveSkill(gb.trans('Unskilled'));
                        
                    }
                }, */
                ok: {
                    label: `<i class="fas fa-check"></i> ${gb.trans('UseSkillSelected')}`,
                    callback: (html)=>{
                    
                        this.saveSkill(html.find('#skillitem')[0].value);
                        
                    }
                }

                
            }
        }).render(true);

        this.dontDisplay=true;

        }
    
    
    }

    showDialog(){
        
      //  let actor=this.sheet.actor;
        let item=this.item;
        let weaponinfo=item.system;
        let weaponactions=item.system.actions;
        let showDamage=true;
        let showRaiseDmg=true;
        let char=new Char(this.actor)
        let powermod=''
        let hasDefaultDamage=true;
        
        let damageActions=[];
      //  let showReload=false;

        let patxt='';
        if (weaponinfo.ap>0){
            patxt=` (${gb.trans('Ap','SWADE')}: ${weaponinfo.ap})`;
        }


        if ((item.type=='power' && !weaponinfo.damage) || item.type=='gear'){
            showDamage=false;
            showRaiseDmg=false;
           
            
        }

        if (item.type=='shield' || item.type=='action'){
            showDamage=false;
            hasDefaultDamage=false;
        }

       

        for (const id in weaponactions.additional){
            if (weaponactions.additional[id].type=='damage'){
                showRaiseDmg=true;
                damageActions.push({id:id,name:weaponactions.additional[id].name});
            }
           
        }

       // let raise=false;
        let content=`<div class="swadetools-dialog-item">
        <div class="swadetools-itemfulldata">`

       

        content+=`<div class="swadetools-2grid">`


        if (item.type == 'weapon') {
            content += `<div><strong>${gb.trans('Dmg','SWADE')}</strong>: ${weaponinfo.damage}${patxt}</div>
            <div><strong>${gb.trans('Mag','SWADE')}</strong>: ${weaponinfo.currentShots}/${weaponinfo.shots}</div>
            <div><strong>${gb.trans('Range._name','SWADE')}</strong>: ${weaponinfo.range}</div>
            ${(() => {
                const target = Array.from(game.user.targets)[0];
                const rangeResult = calculateRangePenaltyForDialog(item, target);
                if (!rangeResult) return `<div><strong>Range Penalty:</strong> No target</div>`;
                if (rangeResult.value === -999) {
                  return `<div><strong>Range Penalty:</strong> Target too far!</div>`;
                }
                return `<div><strong>Range Penalty (${rangeResult.label}):</strong> ${rangeResult.value}</div>`;
              })()}
            <div><strong>${gb.trans('RoF','SWADE')}</strong>: ${weaponinfo.rof}</div>
            <div><strong>Ammo</strong>: ${
            weaponinfo.reloadType === "magazine" &&
            item.flags?.swade?.loadedAmmo?.system?.additionalStats?.ammo?.value
                ? item.flags.swade.loadedAmmo.system.additionalStats.ammo.value
                : (weaponinfo.ammo || "none")
            }</div>`;
          }
            
        
        else if (item.type=='power'){

            if (showDamage){
             
                content+=`<div><strong>${gb.trans('Dmg','SWADE')}</strong>: ${weaponinfo.damage}${patxt}</div>`;
            }
            

          
            if(gb.systemSetting('noPowerPoints')){
                powermod=0-gb.realInt(Math.ceil(weaponinfo.pp/2))
                content+=`<div><strong>${gb.trans('Item.power','TYPES')} ${gb.trans('Modifier')}</strong>: ${powermod} (${gb.realInt(weaponinfo.pp)} ${gb.trans('PPAbbreviation','SWADE')})</div>`

            } else {
                content+=`<div><strong>${gb.trans('PPCost','SWADE')}</strong>: ${gb.realInt(weaponinfo.pp)}/${gb.realInt(char.getActualPP(item.system.arcane))}</div>`
            }
            
            

            content+=`<div><strong>${gb.trans('Range._name','SWADE')}</strong>: ${weaponinfo.range}</div>
            <div><strong>${gb.trans('Dur','SWADE')}</strong>: ${weaponinfo.duration}</div>
            `
        }
       
        content+=`</div>`

        if (item.type=='power' || item.type=='weapon'){
            let templatehtml=gb.getTemplatesHTML(item);
            if (templatehtml){
                content+=`<span class="swade-tools-template-buttons"><strong>Templates:</strong>${templatehtml}</span>`
            }
            
        }

        content+=`<div class="swadetools-formpart swadetools-2grid">
        
        <div class="swadetools-mod-add"><label><strong>${gb.trans('Modifier')}</strong> <i class="far fa-question-circle swadetools-hint" title="${gb.trans('ModHint')}"></i></label></label><input type="text" id="mod" size=3 class="swadetools-input-number" value="${powermod}"></div>`
        
        if ((!gb.systemSetting('noPowerPoints') && item.type=='power') || item.isArcaneDevice){
            let defaultValue='';
            let transTerm=gb.trans('ExtraPP');
            let initialFlag='';
            let hint=gb.trans('PPHint');
            if (item.isArcaneDevice){
                defaultValue=1;
                transTerm=gb.trans('PPCost','SWADE');
                initialFlag='SWADE'
                hint=gb.trans('ArcaneDevicePPHint');
            }   
            content+=`<div class="swade-tools-pp-extra swadetools-mod-add"><label><strong>${transTerm}</strong> <i class="far fa-question-circle swadetools-hint" title="${hint}"></i></label><input type="text" size=3 id="extrapp" value="${defaultValue}" class="swadetools-input-number"></div>`
        }

        // content+=`<div class="swadetools-raise swadetools-raise-${item.type}"><label><strong>${gb.trans('MAPenalty.Label','SWADE')}:</strong></label>
        // <label><input type="radio" name="multiaction" id="multiaction" value="0" checked><strong>${gb.trans('MAPenalty.None','SWADE')}</strong></label>
        // <label><input type="radio" name="multiaction" id="multiaction-2" value="-2"><strong> -2 </strong></label>
        // <label><input type="radio" name="multiaction" id="multiaction-4" value="-4"><strong> -4 </strong></label></div>`;
        

        if (showRaiseDmg){
            content+=`<div class="swadetools-raise swadetools-raise-${item.type}"><label><input type="checkbox" id="raise" value="1"><strong>${gb.trans('RaiseDmg')}</strong></label></div>`;
        }

       

        
        if (gb.setting('useScale')){ ///swat
            let char=new Char(this.actor);
            if (char.hasAbilitySetting('Swat')){
                content+=`<div class="swadetools-raise swadetools-raise-${item.type}"><label><input type="checkbox" id="swat" value="1"><strong>${gb.trans('SwatSetting')}</strong></label></div>`;
            }

        }




        //let showDesperate=false;

        if (gb.setting('wildAttackSkills').split(',').map(s => s.trim()).includes(weaponactions.trait)){ /// wild attack


            content+=`<div class="swadetools-damage-actions swadetools-mod-add"><label><strong>${gb.trans('DesperateWildAttack')}:</strong></label> <select id="desperate">`
            //<option value="">${gb.trans('Default')}</option>`;
            let multiaction=[
                {val:'0',text:gb.trans('MAPenalty.None','SWADE')},
                {val:'1',text:gb.trans('WildAttack')},
                {val:'2',text:`${gb.trans('DesperateAttack')} +2/-2`},
                {val:'4',text:`${gb.trans('DesperateAttack')} +4/-4`},
            ]
         
            multiaction.forEach(act=>{
                content+=`<option value="${act.val}">${act.text}</option>`;
            })

            content+=`</select>
            </div>`;
           /*  content+=`<div class="swadetools-raise swadetools-raise-${item.type}"><label><input type="checkbox" id="wildattack" value="1"><strong>${gb.trans('WildAttack')}</strong></label></div>`;

            if (gb.setting('desperateAttack')){
                showDesperate=true;

            } */
            
        }

        

        if ((hasDefaultDamage && damageActions.length > 0) || (!hasDefaultDamage && damageActions.length > 1)) {
            content += `<div class="swadetools-damage-actions swadetools-mod-add"><label><strong>${gb.trans('Damage')}:</strong> <i class="far fa-question-circle swadetools-hint" title="${gb.trans('ActDmgHint')}"></i></label> <select id="actiondmg">`;

            // 🔍 Try to find ammo modifier name
            let preferredAction = "";
            if (item.system.reloadType === "magazine") {
                const ammoText = item.flags?.swade?.loadedAmmo?.system?.additionalStats?.ammo?.value;
                const match = ammoText?.match(/\(([^)]+)\)/); // extract text in parentheses
                if (match) {
                    const modName = match[1].trim().toLowerCase();
                    const matchAction = damageActions.find(d => d.name?.toLowerCase() === modName);
                    if (matchAction) preferredAction = matchAction.id;
                }
            }

            if (hasDefaultDamage) {
                content += `<option value="" ${preferredAction === "" ? "selected" : ""}>${gb.trans('Default')}</option>`;
            }

            damageActions.forEach(act => {
                const selected = act.id === preferredAction ? "selected" : "";
                content += `<option value="${act.id}" ${selected}>${act.name}</option>`;
            });

            content += `</select></div>`;
        }


            // ✅ Add skill-specific conditional modifiers here
            let skillItem = this.actor.items.find(i => i.type === 'skill' && i.name === weaponactions.trait);
            let condMods = (skillItem?.system?.effects || []).filter(e => e.ignore); // ✅ Only show manual ones

    
            if (condMods.length > 0) {
            content += `<div class="..."><h3>Conditional Modifiers (${weaponactions.trait})</h3></div>`;
            condMods.forEach((mod, index) => {
                content += `<div class="...">
                <label>
                    <input type="checkbox" class="condmod" data-mod="${mod.value}" data-label="${mod.label}" id="condmod-${index}">
                    ${mod.label} (${mod.value >= 0 ? "+" : ""}${mod.value})
                </label>
                </div>`;
            });
            }

            // ✅ Always check for specialization separately
            const specName = skillItem?.system?.additionalStats?.spec?.value;
            if (specName) {
            content += `<div class="swadetools-damage-actions swadetools-mod-add swadetools-mid-title"><h3>Specialization</h3></div>
            <div class="swadetools-damage-actions swadetools-mod-add cond">
                <label>
                    <input type="checkbox" class="skillspec" data-mod="-2" data-label="No Specialization (${specName})" id="skillspec" checked>
                    Use Specialization — <strong>${specName}</strong>
                </label>
            </div>`;
            }
                

        if ( gb.setting('selectModifiers') || gb.setting('askCalledShots')){
        content+=`<div class="swadetools-damage-actions swadetools-mod-add swadetools-mid-title"><h3>${gb.trans("ModOther",'SWADE')}</h3></div>`;
        }



        if (!this.actor.isWildcard && gb.setting('useGroupRolls')){
            content+=`<div class="swadetools-raise swadetools-raise-${item.type}"><label><input type="checkbox" id="grouproll" value="1"><strong>${gb.trans('GroupRoll','SWADE')}</strong></label></div>`;
        }

        /* if (showDesperate){
            content+=`<div class="swadetools-damage-actions swadetools-mod-add"><label><strong>${gb.trans('DesperateAttack')}:</strong></label> <select id="desperate">`
            //<option value="">${gb.trans('Default')}</option>`;
            let multiaction=[
                {val:'0',text:gb.trans('MAPenalty.None','SWADE')+' (0)'},
                {val:'2',text:`${gb.trans('Skill')} +2 / ${gb.trans('Dmg','SWADE')} -2`},
                {val:'4',text:`${gb.trans('Skill')} +4 / ${gb.trans('Dmg','SWADE')} -4`},
            ]
         
            multiaction.forEach(act=>{
                content+=`<option value="${act.val}">${act.text}</option>`;
            })

            content+=`</select>
            </div>`;
        }
 */

        if ( gb.setting('selectModifiers') ){
            content+=`<div class="swadetools-damage-actions swadetools-mod-add"><label><strong>${gb.trans('MAPenalty.Label','SWADE')}:</strong></label> <select id="multiaction">`
            //<option value="">${gb.trans('Default')}</option>`;
            let multiaction=[
                {val:'0',text:gb.trans('MAPenalty.None','SWADE')+' (0)'},
                {val:'-2',text:' -2 '},
                {val:'-4',text:' -4 '},
            ]
         
            multiaction.forEach(act=>{
                content+=`<option value="${act.val}">${act.text}</option>`;
            })

            content+=`</select>
            </div>`;
        
            content+=`<div class="swadetools-damage-actions swadetools-mod-add"><label><strong>${gb.trans('Cover._name','SWADE')}:</strong></label> <select id="cover">`
            //<option value="">${gb.trans('Default')}</option>`;
            let cover=[
                {val:'None',text:gb.trans('MAPenalty.None','SWADE')+' (0)'},
                {val:'Light',text:gb.trans('Cover.Light','SWADE')+ ' (-2)'},
                {val:'Medium',text:gb.trans('Cover.Medium','SWADE')+ ' (-4)'},
                {val:'Heavy',text:gb.trans('Cover.Heavy','SWADE')+ ' (-6)'},
                {val:'Total',text:gb.trans('Cover.Total','SWADE')+ ' (-8)'}
            ]
         
            cover.forEach(act=>{
                content+=`<option value="${act.val}">${act.text}</option>`;
            })

            content+=`</select>
            </div>`;
      
            content+=`<div class="swadetools-damage-actions swadetools-mod-add"><label><strong>${gb.trans('Illumination._name','SWADE')}:</strong></label> <select id="illumination">`
            //<option value="">${gb.trans('Default')}</option>`;
            let illumination=[
                {val:'None',text:gb.trans('MAPenalty.None','SWADE')+' (0)'},
                {val:'Dim',text:gb.trans('Illumination.Dim','SWADE')+ ' (-2)'},
                {val:'Dark',text:gb.trans('Illumination.Dark','SWADE')+ ' (-4)'},
                {val:'Pitch',text:gb.trans('Illumination.Pitch','SWADE')+ ' (-6)'}
            ]
         
            illumination.forEach(act=>{
                content+=`<option value="${act.val}">${act.text}</option>`;
            })

            content+=`</select>
            </div>`;
        }

        if (gb.setting('askCalledShots')){
            content+=`<div class="swadetools-damage-actions swadetools-mod-add"><label><strong>${gb.trans('CalledShot')}:</strong> <i class="far fa-question-circle swadetools-hint" title="${gb.trans('CalledShotHint')}"></i></label> <select id="calledshots">`
            //<option value="">${gb.trans('Default')}</option>`;

          //  console.log(damageActions)

            let called=[
                {val:'Torso',text:gb.trans('Torso','SWADE')+' (0)'},
                {val:'Arms',text:gb.trans('Arms','SWADE')+ ' (-2)'},
                {val:'Legs',text:gb.trans('Legs','SWADE')+ ' (-2)'},
                {val:'Head',text:gb.trans('Head','SWADE')+ ' (-4/+4 '+gb.trans('Damage')+')'}
            ]
         
            called.forEach(act=>{
                content+=`<option value="${act.val}">${act.text}</option>`;
            })
             
            /* for (const i in damageActions) {
                content+=`<option value="${act[i].id}">${act[i].name}</option>`;
            }  */

           

            content+=`</select>
            </div>`;
        }

        
        content+=`</div>`


       

        let buttons={};

        let skillName=weaponactions.trait;
        let skillflag=item.getFlag('swade-tools','skillitem')
        let noMainSkill=false;

        if (this.item.system?.innate){
            skillName=gb.trans('InnatePower');
        }
       
        if (!skillName){

            if (skillflag!==true && this.item.type!='action'){
                skillName=this.noSkillItem();
            } else {
                noMainSkill=true;
            }
            
           
           // skillName=gb.trans('Unskilled');
        }

        
       
           
           // skillName=gb.trans('Unskilled');
        

        


        let skillIcon='<i class="fas fa-bullseye"></i> ';
        let damageIcon='<i class="fas fa-tint"></i> ';
        let resistIcon='<i class="fas fa-shield"></i> ';
        let genericIcon='<i class="fas fa-circle"></i> '
        let macroIcon='<i class="fas fa-robot"></i> ';
        

        if (!noMainSkill){  //// hide button for main skill if there's no skill

        buttons.mainSkill={
            label: skillIcon+skillName+gb.stringMod(gb.itemSkillMod(this.item)),
            callback: async (html)=>{
                
                let itemRoll=new ItemRoll(this.actor,this.item);
                
                
                await this.processItemFormDialog(html,itemRoll);               
                await itemRoll.rollBaseSkill();               
                itemRoll.display();
               

                /* let data={
                    mod: {
                        value: weaponactions.skillMod,
                        reason: gb.trans('ModItem')
                    },
                    skill: weaponactions.skill,
                    weapon: item.name+patxt,
                    weaponid: item._id,
                }

                this.processRoll(html,data); */
            }
        }
    }
        
        if (showDamage){
        buttons.mainDamage={
            label: damageIcon+gb.trans('Damage'),//weaponinfo.damage+gb.stringMod(weaponactions.dmgMod),
            
            callback: async (html)=>{
               
                let itemRoll=new ItemRoll(this.actor,this.item)
                await this.processItemFormDialog(html,itemRoll,'damage');
                await itemRoll.rollBaseDamage();
                itemRoll.display();

                /* let data={
                    mod: {
                        value: weaponactions.dmgMod,
                        reason: gb.trans('ModItem')
                    },
                    damage: weaponinfo.damage,
                    weapon: item.name+patxt,
                    weaponid: item._id,
                }

                this.processRoll(html,data); */
            }
        }
    }
      

    if (weaponinfo.shots>0 && weaponinfo.reloadType!="none"){ /// autoReload
        buttons.reload={
            label: `<i class="fas fa-redo"></i> `+gb.trans('Reload','SWADE'),
            callback: ()=> {
                this.item.reload(); // swade system reload
                //gb.rechargeWeapon(this.actor,this.item);
            }
        }

        /* swade system now handles reload
         if (gb.setting('reloadX')){
            
            buttons.reloadx={
                label: `<i class="fas fa-spinner"></i> `+gb.trans('Reload','SWADE')+' X',
                callback: ()=> {
                    /// ask how many bullets
                    gb.rechargeWeaponXDialog(this.actor,this.item);
                }
            }
        } */
    }

    if (weaponinfo.shots > 0 && weaponinfo.reloadType === "magazine") { // only for magazine weapons
        buttons.ejectmag = {
            label: `<i class="fas fa-eject"></i> Eject Mag`,
            callback: async (html) => {
              const loadedAmmo = this.item.flags?.swade?.loadedAmmo;
              
              if (!loadedAmmo) {
                ui.notifications.warn("No magazine loaded to eject!");
                return;
              }
        
              const actor = this.actor;
              if (!actor) {
                ui.notifications.warn("No actor found for this weapon.");
                return;
              }
        
              // ✅ Use Foundry-safe duplicate method
              const magData = foundry.utils.duplicate(loadedAmmo);

            magData.system.quantity = 1;
            magData.system.equippable = false;

            // ✅ Transfer remaining shots into ejected mag's charges
            if (!magData.system.charges) magData.system.charges = {};
            magData.system.charges.value = item.system.currentShots ?? magData.system.charges.max;

              await actor.createEmbeddedDocuments("Item", [magData]);
        
              await this.item.update({
                "flags.swade.loadedAmmo": null,
                "system.currentShots": 0
              });
        
              ui.notifications.info(`Magazine (${magData.system.charges?.value ?? 'Unknown'} rounds) ejected to inventory.`);
            }
        };                               
      }
      

        if (skillName==gb.setting('fightingSkill')){
           /*  buttons.wildattack={
                label: gb.trans('WildAttack'),
                callback: (html)=>{
                    let itemRoll=new ItemRoll(this.actor,this.item);
                    
            //    console.log(this.item);
                    this.processItemFormDialog(html,itemRoll);
                    
                   
                    itemRoll.rollBaseSkill();                  
                    itemRoll.wildAttack();
                    itemRoll.display();
                }
            } */

            let char=new Char(this.actor);

            if (char.hasEdgeSetting('Frenzy') || char.hasEdgeSetting('Improved Frenzy')){

                let btFrenzyName;
                let frenzyRof;

                if (char.hasEdgeSetting('Improved Frenzy')){

                    btFrenzyName=gb.settingKeyName('Improved Frenzy')
                    frenzyRof=3
                } else if (char.hasEdgeSetting('Frenzy')){
                    btFrenzyName=gb.settingKeyName('Frenzy')
                    frenzyRof=2
                }

                buttons.frenzy={
                    label: btFrenzyName,
                    callback: async (html)=>{
                        let itemRoll=new ItemRoll(this.actor,this.item);
                    
            //    console.log(this.item);
                    await this.processItemFormDialog(html,itemRoll,'skill');                    
                    
                    await itemRoll.rollBaseSkill(frenzyRof);                  
                   
                    itemRoll.display();
                    }
                }
            }
        }


        if (skillName == gb.setting('shootingSkill')) {
            let rof = gb.realInt(this.item?.system?.rof)+1;
              
            let char = new Char(this.actor);
            if (char.hasEdgeSetting('Rapid Fire')) {
                buttons.rapidFire={
                    label: gb.settingKeyName('Rapid Fire') +' ('+gb.trans('RoF','SWADE')+' '+rof+')',
                    callback: async (html)=>{
                        let itemRoll=new ItemRoll(this.actor,this.item);
                        itemRoll.useShots(gb.RoFBullets[rof])
                        await this.processItemFormDialog(html,itemRoll,'skill');
                        
                        await itemRoll.rollBaseSkill(rof);
                        itemRoll.display();
                    }
                }
            }
        }


        if (item.isArcaneDevice){
            buttons['arcanedevice']={
                label: gb.trans('ActivateArcaneDevice','SWADE'),
                callback: async (html)=>{


                    let itemRoll=new ItemRoll(this.actor,this.item)
                await this.processItemFormDialog(html,itemRoll,'skill');

                await itemRoll.rollArcaneDevice();
              //  itemRoll.rollBaseDamage();
                itemRoll.display();
                }
            }
        }
      

        for (const id in weaponactions.additional){
           
            let action=weaponactions.additional[id];

            let actionIcon;
            if (action.type=='trait'){
                actionIcon=skillIcon;
            } else if (action.type=='damage'){
                actionIcon=damageIcon;
            }else if (action.type=='resist'){
                actionIcon=resistIcon;
            } else if (action.type=='macro'){
                actionIcon=macroIcon
            }else {
                actionIcon=genericIcon
            }
       



           /// go to RollControl
                buttons[id]={
                    label: actionIcon+action.name,
                    callback: async (html)=>{

                        if (action.type=='resist'){ 

                            gb.rollResist(action.skillOverride,action.traitMod);
                        
                        } else if (action.type === 'macro') {
                            // Safe defaults for Swade macro system to prevent crash
                            const chatData = {
                              flags: {
                                "swade-tools": {
                                  mods: []
                                }
                              }
                            };
                            game.swade.itemChatCardHelper.handleAdditionalActions(this.item, this.actor, id, chatData);
                        } else if (action.type === 'trait') {
                        // Roll the specified skill using SWADE core dialog, not ItemRoll
                        const skillName = action.skillOverride || this.item.system.actions.trait;
                        const skillItem = this.actor.items.find(i => i.type === "skill" && i.name === skillName);
                        
                        if (skillItem) {
                            // Call the regular SWADE skill roll
                            skillItem.roll();
                        } else {
                            ui.notifications.warn(`Skill "${skillName}" not found on actor.`);
                        }
                    } else {
                        let itemRoll = new ItemRoll(this.actor, this.item);
                        await this.processItemFormDialog(html, itemRoll, action.type);
                        await itemRoll.rollAction(id);
                        itemRoll.display();
                    }



                    }
                }
            
        }

      

      
        if (!this.dontDisplay){
        new Dialog({
            title: item.name,
            content: content,
            buttons: buttons,
            render: (html)=>{

               gb.modButtons(html);
               html.find(".swadetools-skill-popup").on("click", (ev) => {
                const skillName = ev.currentTarget.dataset.skill;
            });
                 

                html.on('click','button[data-template]',button=>{
                        
                    let templateType=$(button.currentTarget).data("template");

                    gb.showTemplate(templateType,item);
                    
                   
                })

                // Check if a template has been placed for this item
                const template = canvas.templates.placeables.find(t =>
                    t.document.flags["swade-tools"]?.itemId === item.id
                );
                
                if (template) {
                    const center = {
                    x: template.document.x + (template.document.width / 2),
                    y: template.document.y + (template.document.height / 2)
                    };
                
                    const originToken = this.actor.getActiveTokens()[0];
                    if (originToken) {
                    const distance = canvas.grid.measureDistance(originToken.center, center);
                
                    // Parse range bands from item.system.range
                    let rangeLabel = "Short", penalty = 0;
                    if (item.system.range?.includes('/')) {
                        const [shortStr, medStr, longStr] = item.system.range.split('/').map(s => parseInt(s));
                        if (distance > longStr) {
                        rangeLabel = "Too Far";
                        penalty = -999;
                        } else if (distance > medStr) {
                        rangeLabel = "Long";
                        penalty = -4;
                        } else if (distance > shortStr) {
                        rangeLabel = "Medium";
                        penalty = -2;
                        }
                    }
                
                    console.log(`[Swade Tools] Template Range to target: ${Math.round(distance)}" (${rangeLabel}${penalty < 0 ? `: ${penalty}` : ""})`);

                
                    // Optional: store for use in RollControl
                    // await this.item.setFlag("swade-tools", "templateCenter", center);
                    }
                }
                
                
                
            }
        },{classes:['dialog swadetools-vertical']}).render(true);
        }
        
    }

    async showMagazineDialog() {
        const item = this.item;
        const actor = this.actor;
    
        let content = `<div class="swadetools-dialog-item">
        <h2>${item.name}</h2>
        <p><strong>Current Shots:</strong> ${item.system.charges.value}/${item.system.charges.max}</p>`;
    
        // Button to reload
        let buttons = {};
    
        buttons.reload = {
            label: `<i class="fas fa-redo"></i> Reload`,
            callback: async () => {
                const ammoName = item.system.additionalStats?.ammo?.value;
                if (!ammoName) {
                    ui.notifications.warn("No Ammo stat defined for this magazine.");
                    return;
                }
    
                const ammoItem = actor.items.find(i => i.type == 'gear' && i.system.isAmmo && i.name == ammoName);
                if (!ammoItem) {
                    ui.notifications.warn(`No matching ammo item found: ${ammoName}`);
                    return;
                }
    
                const missingShots = item.system.charges.max - item.system.charges.value;
                const ammoAvailable = ammoItem.system.quantity;
    
                if (ammoAvailable <= 0) {
                    ui.notifications.warn(`No ammo available to reload.`);
                    return;
                }
    
                const toLoad = Math.min(missingShots, ammoAvailable);
    
                await item.update({ "system.charges.value": item.system.charges.value + toLoad });
                await ammoItem.update({ "system.quantity": ammoAvailable - toLoad });
    
                ui.notifications.info(`Reloaded ${toLoad} rounds into magazine.`);
            }
        };
    
        new Dialog({
            title: item.name,
            content: content,
            buttons: buttons
        }).render(true);
    }
    
    


    /* processRoll(html,data){
      //  console.log(data);
        let charRoll=new CharRoll(this.actor)
        let type='skill';
        if (data.damage!==undefined){
            type='damage';
        }
        this.processItemFormDialog(html,charRoll);

        charRoll.combatRoll(data.weaponid);


        if (data.shots!==undefined){
            charRoll.useShots(data.shots);
        }

        charRoll.addFlavor(data.weapon);

        if (data.mod!==undefined){
           
              
                charRoll.addModifier(data.mod.value,data.mod.reason);
            
        }

        if (type=='skill'){
            let rof=1;
            if (data.rof!==undefined){
                rof=data.rof;
            }
            
            charRoll.rollSkill(data.skill,rof);
        } else

        if (type=='damage'){
            
            charRoll.rollDamage(data.damage)
        }

        
        charRoll.display();
    } */

    async processItemFormDialog(html,charRoll,actionType){
        
        if (this.vehicle){
            charRoll.usingVehicle(this.vehicle);
        }
        
           charRoll.addModifier(html.find("#mod")[0].value,gb.trans('Additional'))
            if (html.find("#raise")[0]?.checked){
                charRoll.raiseDmg();
            } 


           /*  if (html.find("#wildattack")[0]?.checked){
                charRoll.addModifier(2,gb.trans('WildAttack'));
                await charRoll.wildAttack();
            }  */

            if (html.find("#swat")[0]?.checked){
                charRoll.addFlag('useswat',1);
            } 


            if (html.find("#grouproll")[0]?.checked){
                charRoll.rollGroup();
            }
        
            if (html.find('#extrapp')[0]){
                charRoll.usePP(html.find('#extrapp')[0].value);
            }

            if (html.find('#calledshots')[0]){
                charRoll.addFlag('usecalled',html.find('#calledshots')[0].value);
                
                
            }

            if (html.find("#multiaction")[0]){
                charRoll.addModifier(html.find('#multiaction')[0].value,gb.trans('MAPenalty.Label','SWADE'));
            } 

            if (html.find("#desperate")[0]){
                let despmod=html.find('#desperate')[0].value;
                if (despmod==1){ /// wildAttack
                    charRoll.addModifier(2,gb.trans('WildAttack'));
                    await charRoll.wildAttack();
                } else {
                if (actionType=='damage'){
                    despmod=0-gb.realInt(html.find('#desperate')[0].value)
                }
                charRoll.addModifier(despmod,gb.trans('DesperateAttack'));
                charRoll.addFlag('desperateattack',html.find('#desperate')[0].value);
                }
            } 

            if (html.find('#cover')[0]){
                switch (html.find('#cover')[0].value) {
                    case 'Light':
                        charRoll.addModifier(-2,gb.trans('Cover.Light','SWADE'));
                        break;
                    case 'Medium':
                        charRoll.addModifier(-4,gb.trans('Cover.Medium','SWADE'));
                        break;
                    case 'Heavy':
                        charRoll.addModifier(-6,gb.trans('Cover.Heavy','SWADE'));
                        break;
                    case 'Total':
                        charRoll.addModifier(-8,gb.trans('Cover.Total','SWADE'));
                        break;
                }
            }
            if (html.find('#illumination')[0]){
                switch (html.find('#illumination')[0].value) {
                    case 'Dim':
                        charRoll.addModifier(-2,gb.trans('Illumination.Dim','SWADE'));
                        break;
                    case 'Dark':
                        charRoll.addModifier(-4,gb.trans('Illumination.Dark','SWADE'));
                        break;
                    case 'Pitch':
                        charRoll.addModifier(-6,gb.trans('Illumination.Pitch','SWADE'));
                        break;
                }
            }

            if (html.find('#actiondmg')[0] && html.find('#actiondmg')[0].value!=''){
                charRoll.useDamageAction(html.find('#actiondmg')[0].value);
            }

        // Apply any selected conditional modifiers
        html.find(".condmod:checked").each((_, el) => {
            const mod = parseInt(el.dataset.mod);
            const label = el.dataset.label;
            if (!isNaN(mod)) {
                charRoll.addModifier(mod, label);
            }
        });

        // ✅ Apply skill specialization penalty if unchecked
        const specCheckbox = html.find(".skillspec")[0];
        if (specCheckbox && !specCheckbox.checked) {
            const mod = parseInt(specCheckbox.dataset.mod);
            const label = specCheckbox.dataset.label;
            if (!isNaN(mod)) {
                charRoll.addModifier(mod, label);
            }
        }  
    }
    
}

function calculateRangePenaltyForDialog(item, target) {
    const origin = canvas.tokens.controlled[0]; // using controlled token instead of item.actor.token
    if (!target || !origin || !item?.system?.range?.includes('/')) return null;
  
    const ranges = item.system.range.split('/').map(r => parseInt(r.trim(), 10));
    if (ranges.length !== 3) return null;
  
    try {
      const result = canvas.grid.measurePath([origin, target]);
      const distance = result.distance;
  
      let label = "Short";
      let penalty = 0;
  
      if (distance > ranges[0]) {
        label = "Medium";
        penalty = -2;
      }
      if (distance > ranges[1]) {
        label = "Long";
        penalty = -4;
      }
      if (distance > ranges[2] * 4) {
        return { label: "Too Far", value: -999, distance };
      }
  
      return { label, value: penalty, distance };
    } catch (e) {
      console.warn("Range penalty calculation failed:", e);
      return null;
    }
  }


  window.calculateRangePenaltyForDialog = calculateRangePenaltyForDialog;  