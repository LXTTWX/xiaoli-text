fetch('a73cb4f03970f50d88ded339a76b0620.jpg').then(r=>r.arrayBuffer()).then(buf=>{
    const v=new DataView(buf);
    if(v.getUint16(0)!==0xFFD8){console.log('Not JPEG');return;}
    let off=2;
    while(off<v.byteLength-1){
        if(v.getUint8(off)!==0xFF){off++;continue;}
        const m=v.getUint8(off+1);
        if(m===0xE1){
            const sz=v.getUint16(off+2);
            const h=String.fromCharCode(v.getUint8(off+4),v.getUint8(off+5),v.getUint8(off+6),v.getUint8(off+7));
            if(h==='Exif'){
                const ts=off+10;
                const lit=v.getUint16(ts)===0x4949;
                const ifd=v.getUint32(ts+4,lit);
                const n=v.getUint16(ts+ifd,lit);
                console.log('Entries:',n,'Little:',lit);
                for(let i=0;i<n;i++){
                    const e=ts+ifd+2+i*12;
                    const tag=v.getUint16(e,lit);
                    if(tag===0x8769||tag===0x9003||tag===0x0132){
                        const tp=v.getUint16(e+2,lit);
                        const cnt=v.getUint32(e+4,lit);
                        let vo=cnt<=4?e+8:ts+v.getUint32(e+8,lit);
                        let s='';if(tp===2){for(let j=0;j<cnt-1;j++)s+=String.fromCharCode(v.getUint8(vo+j));}
                        console.log('Tag:',tag.toString(16),'Val:',s||v.getUint32(e+8,lit));
                    }
                }
            }
            off+=2+sz;
        } else if((m&0xE0)===0xE0){off+=2+v.getUint16(off+2);} else {off+=2;}
    }
});
