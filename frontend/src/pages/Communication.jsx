import { useEffect, useState } from 'react';
import { Send, MessageSquare, Inbox as InboxIcon } from 'lucide-react';
import api from '../api/client';

const emptyForm = { recipient_role: 'Teacher', subject: '', body: '' };

export default function Communication() {
  const [tab, setTab] = useState('inbox'); // 'inbox' | 'sent'
  const [inbox, setInbox] = useState([]);
  const [sent, setSent] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const loadInbox = () => api.get('/messages').then((res) => setInbox(res.data)).catch(() => {});
  const loadSent = () => api.get('/messages/sent').then((res) => setSent(res.data)).catch(() => {});

  useEffect(() => {
    loadInbox();
    loadSent();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    setMessage('');
    try {
      await api.post('/messages', form);
      setForm({ ...emptyForm, recipient_role: form.recipient_role });
      setMessage('Message sent.');
      loadSent();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  const list = tab === 'inbox' ? inbox : sent;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <MessageSquare size={20} /> Communication
        </h1>
        <p className="text-sm text-slate-500">Send announcements to Admin, Principal, Teachers, Parents, or Students</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex gap-2">
            <button onClick={() => setTab('inbox')}
              className={`text-sm px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${tab === 'inbox' ? 'bg-brand-blue text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
              <InboxIcon size={14} /> Inbox
            </button>
            <button onClick={() => setTab('sent')}
              className={`text-sm px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${tab === 'sent' ? 'bg-brand-blue text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
              <Send size={14} /> Sent
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {list.map((m) => (
              <div key={m.id} className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-800">{m.subject || '(No subject)'}</p>
                  <span className="text-xs text-slate-400">{new Date(m.sent_at).toLocaleString()}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {tab === 'inbox' ? `From: ${m.sender_name || 'Unknown'}` : `To: ${m.recipient_role}`}
                </p>
                <p className="text-sm text-slate-600 mt-2">{m.body}</p>
              </div>
            ))}
            {!list.length && (
              <p className="text-center text-slate-400 py-8">
                {tab === 'inbox' ? 'No messages in your inbox yet.' : "You haven't sent any messages yet."}
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 h-fit">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Compose</h2>
          <form onSubmit={handleSend} className="space-y-3">
            <select value={form.recipient_role} onChange={(e) => setForm({ ...form, recipient_role: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
              <option value="admin">Admin</option>
              <option value="principal">Principal</option>
              <option value="teacher">All Teachers</option>
              <option value="parent">All Parents</option>
              <option value="student">All Students</option>
            </select>
            <input placeholder="Subject" value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            <textarea required placeholder="Type your message..." rows={5} value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />

            {message && <p className="text-sm text-slate-600">{message}</p>}

            <button type="submit" disabled={sending}
              className="w-full flex items-center justify-center gap-2 bg-brand-blue text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              <Send size={16} /> {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}