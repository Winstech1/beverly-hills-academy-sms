import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper } from 'lucide-react';
import api from '../api/client';

export default function PublicNews() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/news/public').then((res) => setPosts(res.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-navy-950 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-blue to-blue-700 flex items-center justify-center font-bold">
            BH
          </div>
          <div>
            <p className="font-semibold leading-tight">Beverly Hills Academy, Wa</p>
            <p className="text-xs text-slate-400 leading-tight">News & Announcements</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
          <Newspaper size={22} /> Latest News
        </h1>

        {loading && <p className="text-slate-400">Loading...</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {posts.map((p) => (
            <Link key={p.id} to={`/public/news/${p.slug}`}
              className="block bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              {p.image_url && (
                <img src={p.image_url} alt={p.title} className="w-full h-40 object-cover" />
              )}
              <div className="p-4">
                <h2 className="font-semibold text-slate-800">{p.title}</h2>
                <p className="text-sm text-slate-500 mt-2 line-clamp-3">{p.excerpt}</p>
                <p className="text-xs text-slate-400 mt-3">
                  {p.author_name || 'School Admin'} • {new Date(p.published_at).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
          {!loading && !posts.length && (
            <p className="col-span-full text-center text-slate-400 py-12">No news posted yet — check back soon.</p>
          )}
        </div>
      </main>

      <footer className="text-center text-xs text-slate-400 py-8">
        Beverly Hills Academy, Wa
      </footer>
    </div>
  );
}