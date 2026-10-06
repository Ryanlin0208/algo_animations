(function(root) {
  function trace(s) {
    if(typeof s !== 'string' || !s.length || s.length > 80 || !/^[a-zA-Z0-9\[\]]+$/.test(s)) throw new Error('請輸入 1–80 個英文字母、數字與方括號。');
    // Validate grammar and expansion size before allocating decoded strings.
    let at=0;
    function length(nested=false) {
      let size=0;
      while(at<s.length && s[at]!==']') {
        if(/[a-zA-Z]/.test(s[at])) {size++;at++;}
        else {
          if(!/[0-9]/.test(s[at])) throw new Error('左括號前必須有正整數次數。');
          let digits='';while(at<s.length && /[0-9]/.test(s[at]))digits+=s[at++];
          const count=Number(digits);
          if(!Number.isSafeInteger(count)||count<1||count>300||s[at]!=='[')throw new Error('重複次數須為 1–300，並緊接 [字串]。');
          at++;const inner=length(true);if(!inner)throw new Error('括號中不可為空。');size+=count*inner;
        }
        if(size>2000)throw new Error('動畫展開結果最多 2,000 字元，請縮小重複次數。');
      }
      if(nested){if(s[at]!==']')throw new Error('缺少右括號 ]。');at++;}
      return size;
    }
    length();if(at!==s.length)throw new Error('出現多餘的右括號 ]。');
    const frames=[],stack=[];let current_string='',current_number=0;
    function add(phase,line,title,note,extra={}) {frames.push({phase,line,title,note,current_string,current_number,stack:stack.map(pair=>[...pair]),...extra});}
    add('init',[3,4,5],'初始化堆疊與累積變數','stack = []，current_string = ""，current_number = 0。');
    [...s].forEach((char,index)=>{
      const info={char,index};add('visit',[7],'讀取下一個字元',`s[${index}] = ${JSON.stringify(char)}`,info);
      if(/[0-9]/.test(char)) {
        add('branch',[8],'這是數字','先前數字乘 10，再加本位數；可處理多位數。',info);
        const old=current_number;current_number=current_number*10+Number(char);
        add('number',[9],'累積重複次數',`${old} × 10 + ${char} = ${current_number}`,info);
      } else if(char==='[') {
        add('branch',[10],'進入一層括號','先保存外層字串和這一層的重複次數。',info);
        stack.push([current_string,current_number]);add('push',[11],'將外層狀態推入堆疊','堆疊頂端是最後保存、最先取回的狀態。',info);
        current_string='';add('reset-string',[12],'清空目前字串','接下來累積括號內的內容。',info);
        current_number=0;add('reset-number',[13],'重複次數歸零','準備讀取內層可能出現的新次數。',info);
      } else if(char===']') {
        add('branch',[14],'完成目前這一層','取回最近一次保存的外層狀態。',info);
        const [previous_string,repeat]=stack.pop(),inner=current_string;
        const expansion={...info,previous_string,repeat,inner};
        add('pop',[15],'彈出堆疊頂端',`取出 previous_string 與 repeat = ${repeat}；目前字串尚未展開。`,expansion);
        current_string=previous_string+current_string.repeat(repeat);
        add('expand',[16],'外層字串 + 內層字串 × 次數','先重複括號內的內容，再接回先前保存的外層字串。',expansion);
      } else {
        add('branch',[17],'這是一般字母','直接接到 current_string 的尾端。',info);
        current_string+=char;add('append',[18],'加入目前字串',`current_string += ${JSON.stringify(char)}`,info);
      }
    });
    add('done',[20],'解碼完成','所有字元已掃描，堆疊為空，回傳 current_string。');return frames;
  }
  if(typeof module!=='undefined')module.exports=trace;else root.decodeTrace=trace;
})(globalThis);
