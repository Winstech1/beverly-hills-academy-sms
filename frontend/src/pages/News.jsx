import { useEffect, useState } from 'react';
import { Plus, X, Newspaper, Trash2, Globe, EyeOff } from 'lucide-react';
import api from '../api/client';

const emptyForm = { title: '', body: '', image_url: '', published: false };

export default function News() {
  const [posts, setPosts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  const load = () => api.get('/news').then((res) => setPosts(res.data)).catch(() => {});

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post('/news', form);
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not create post.');
    }
  };

  const togglePublish = async (post) => {
    try {
      await api.put(`/news/${post.id}`, { published: !post.published });
      load();
    } catch {
      // list stays as-is if it fails
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this post permanently?')) return;
    try {
      await api.delete(`/news/${id}`);
      load();
    } catch {
      // stays listed if delete fails
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Newspaper size={20} /> News & Blog
          </h1>
          <p className="text-sm text-slate-500">
            {posts.length} post{posts.length === 1 ? '' : 's'} • Public page:{' '}
            <a href="/public/news" target="_blank" rel="noreferrer" className="text-brand-blue hover:underline">
              /public/news
            </a>
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-brand-blue text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={16} /> New Post
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {posts.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-slate-800">{p.title}</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${p.published ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                {p.published ? 'Published' : 'Draft'}
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-2 line-clamp-2">{p.body}</p>
            <p className="text-xs text-slate-400 mt-2">
              By {p.author_name || 'Unknown'} • {new Date(p.created_at).toLocaleDateString()}
            </p>
            <div className="flex items-center gap-3 mt-3">
              <button onClick={() => togglePublish(p)} className="text-xs text-brand-blue hover:underline flex items-center gap-1">
                {p.published ? <><EyeOff size={12} /> Unpublish</> : <><Globe size={12} /> Publish</>}
              </button>
              <button onClick={() => handleDelete(p.id)} className="text-slate-300 hover:text-red-600 ml-auto">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {!posts.length && (
          <p className="col-span-full text-center text-slate-400 py-8">No posts yet.</p>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
            <h2 className="text-lg font-semibold mb-4">New Post</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required placeholder="Title" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Image URL (optional)" value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <textarea required placeholder="Write the post..." rows={6} value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={form.published}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })} />
                Publish immediately (otherwise saved as a draft)
              </label>

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <button type="submit" className="w-full bg-brand-blue text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700">
                Save Post
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}