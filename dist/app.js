import { streamChat } from './chat-client.js';
const $ = id => document.getElementById(id);
const chats = [];
let currentId = null, active = null, composing = false;
const icon = name => `<svg><use href="#${name}"/></svg>`;
function toast(text) { $('toast').textContent = text; $('toast').classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => $('toast').classList.remove('show'), 2400); }
function closeSidebar() { document.body.classList.remove('sidebar-open'); }
function refreshHistory() {
  $('history').replaceChildren();
  chats.forEach(chat => {
    const button = document.createElement('button'); button.className = 'history-item' + (chat.id === currentId ? ' active' : '');
    button.innerHTML = icon('chat'); const label = document.createElement('span'); label.textContent = chat.title; button.append(label);
    button.onclick = () => { stop(); currentId = chat.id; render(); closeSidebar(); }; $('history').append(button);
  });
  $('history-empty').hidden = !!chats.length; $('chat-count').textContent = chats.length;
}
function scroll() { $('workspace').scrollTop = $('workspace').scrollHeight; }
function makeMessage(message) {
  const row = document.createElement('div'); row.className = 'message ' + message.role;
  if (message.role === 'assistant') {
    const mark = document.createElement('div'); mark.className = 'assistant-mark'; mark.innerHTML = icon('spark'); row.append(mark);
    const content = document.createElement('div'); content.className = 'assistant-content';
    const label = document.createElement('div'); label.className = 'response-label'; label.textContent = 'ORBIT · 데모 응답'; content.append(label);
    const body = document.createElement('div'); body.className = 'message-body'; body.textContent = message.content;
    if (!message.content && !message.done) { body.innerHTML = '<div class="typing" aria-label="응답 생성 중"><i></i><i></i><i></i></div>'; }
    content.append(body);
    if (message.done && message.content) {
      const copy = document.createElement('button'); copy.className = 'copy-button'; copy.innerHTML = icon('copy'); copy.append('복사');
      copy.onclick = async () => { try { await navigator.clipboard.writeText(message.content); toast('답변을 복사했어요'); } catch { toast('복사할 텍스트를 직접 선택해 주세요'); } }; content.append(copy);
    }
    row.append(content);
  } else { const body = document.createElement('div'); body.className = 'message-body'; body.textContent = message.content; row.append(body); }
  return row;
}
function render() {
  const chat = chats.find(c => c.id === currentId);
  $('welcome').style.display = chat ? 'none' : ''; $('messages').style.display = chat ? 'block' : 'none';
  $('messages').replaceChildren(...(chat?.messages || []).map(makeMessage)); refreshHistory(); updateSend(); scroll();
}
function updateSend() { $('send').disabled = !active && !$('prompt').value.trim(); $('send').classList.toggle('busy', !!active); $('send').setAttribute('aria-label', active ? '응답 생성 중단' : '메시지 보내기'); }
function resize() { $('prompt').style.height = 'auto'; $('prompt').style.height = Math.min($('prompt').scrollHeight, 170) + 'px'; updateSend(); }
function stop() { if (active) { active.abort(); active = null; } updateSend(); }
function newChat() { stop(); currentId = null; $('prompt').value = ''; resize(); render(); closeSidebar(); $('prompt').focus(); }
async function send() {
  if (active) { stop(); return; }
  const content = $('prompt').value.trim(); if (!content) return;
  let chat = chats.find(c => c.id === currentId);
  if (!chat) { chat = { id: crypto.randomUUID(), title: content.slice(0, 32), messages: [] }; chats.unshift(chat); currentId = chat.id; }
  chat.messages.push({role:'user', content});
  const history = chat.messages.map(m => ({ role:m.role, content:m.content }));
  const answer = { role:'assistant', content:'', done:false }; chat.messages.push(answer);
  const controller = new AbortController(); active = controller; $('prompt').value = ''; resize(); render();
  try {
    for await (const chunk of streamChat({messages:history, signal:controller.signal})) {
      answer.content += chunk;
      if (currentId === chat.id) { const last = $('messages').lastElementChild; last.querySelector('.message-body').textContent = answer.content; scroll(); }
    }
  } catch (error) { if (error.name !== 'AbortError') { answer.content += '\n응답을 불러오지 못했어요. 다시 메시지를 보내 주세요.'; } }
  finally { answer.done = true; if (!answer.content) answer.content = '응답 생성을 중단했어요.'; if (active === controller) active = null; if (currentId === chat.id) render(); else updateSend(); }
}
$('composer').onsubmit = event => { event.preventDefault(); send(); };
$('prompt').oninput = resize;
$('prompt').addEventListener('compositionstart', () => composing = true);
$('prompt').addEventListener('compositionend', () => composing = false);
$('prompt').onkeydown = event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && !composing && event.keyCode !== 229) { event.preventDefault(); if (!active) send(); } };
$('new-chat').onclick = newChat;
document.querySelectorAll('[data-prompt]').forEach(button => button.onclick = () => { $('prompt').value = button.dataset.prompt; resize(); $('prompt').focus(); });
$('close-sidebar').onclick = () => { if (matchMedia('(max-width:700px)').matches) closeSidebar(); else document.body.classList.add('collapsed'); };
$('open-sidebar').onclick = () => { if (matchMedia('(max-width:700px)').matches) document.body.classList.add('sidebar-open'); else document.body.classList.remove('collapsed'); };
$('overlay').onclick = closeSidebar;
document.addEventListener('keydown', event => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); newChat(); } if (event.key === 'Escape') closeSidebar(); });
$('theme-toggle').onclick = () => { document.body.classList.toggle('dark'); $('theme-toggle').setAttribute('aria-label', document.body.classList.contains('dark') ? '밝은 화면으로 변경' : '어두운 화면으로 변경'); };
render();
